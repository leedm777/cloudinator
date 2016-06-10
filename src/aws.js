import AWS from 'aws-sdk';
import _ from 'lodash';

import { log } from './util/log';

export const cfn = new AWS.CloudFormation({
  apiVersion: '2010-05-15',
  region: 'us-east-1',
});

async function listAllResourcesImpl(StackName, NextToken) {
  const { StackResourceSummaries: resources, NextToken: nextNextToken } =
    await cfn.listStackResources({ StackName, NextToken }).promise();

  if (nextNextToken) {
    const moreResources = await listAllResourcesImpl(StackName, nextNextToken);
    return resources.concat(moreResources);
  }

  return resources;
}

/**
 * List all of the resources. The returned StackResourceSummary are documented
 * at http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFormation.html#listStackResources-property.
 *
 * @param {String} stackName Name of the stack.
 * @returns {Array} Array of StackResourceSummary object.
 */
export function listAllResources({ stackName }) {
  return listAllResourcesImpl(stackName, null);
}

async function describeStackImpl(StackName) {
  try {
    const data = await cfn.describeStacks({ StackName }).promise();
    return _.get(data, 'Stacks[0]');
  } catch (err) {
    // validation errors are when the stack isn't found; otherwise rethrow
    if (_.get(err, 'code') === 'ValidationError') {
      return null;
    }
    throw err;
  }
}
const memoizedDescribeStackImpl = _.memoize(describeStackImpl);

/**
 * Returns the description of a stack. If the stack does not exist, returns `null`.
 *
 * @param {String} stackName Name of the stack to describe.
 * @param {Boolean} [cached] If true, use a local cache for stack state.
 * @returns {*}
 */
export function describeStack({ stackName, cached = true } = {}) {
  if (!_.isString(stackName)) {
    throw new TypeError('stackName should be a string');
  }
  if (cached) {
    return memoizedDescribeStackImpl(stackName);
  }
  return describeStackImpl(stackName);
}

/**
 * Get the last event id for the given stack. This can be fed into waitForAndLogEvents
 * to omit old events from the log.
 *
 * @param {String} stackName Name or id of the stack to describe.
 * @returns {String|undefined} Id of the last stack event.
 */
export async function getLastEventId({ stackName }) {
  const rawEvents = await cfn.describeStackEvents({ StackName: stackName }).promise();
  return _.get(rawEvents, 'StackEvents[0].EventId');
}

export async function waitForAndLogEvents({ stackName, lastEventId }) {
  // be sure to get stack status prior to getting the events. otherwise the
  // final events might race the _COMPLETE or _FAILED status, and we could
  // miss them.
  const stack = await describeStack({ stackName, cached: false });

  let { StackEvents: stackEvents } =
    await cfn.describeStackEvents({ StackName: stackName }).promise();

  // oldest events are at the end of the array; discard everything past
  // lastEventId
  stackEvents = _.takeWhile(stackEvents, e => e.EventId !== lastEventId);

  if (!_.isEmpty(stackEvents)) {
    _.forEachRight(stackEvents,
      stackEvent => {
        if (stackEvent.ResourceStatus.endsWith('_FAILED')) {
          log.error({ stackEvent },
            `${stackEvent.LogicalResourceId} ${stackEvent.ResourceStatus}`);
        } else {
          log.info({ stackEvent },
            `${stackEvent.LogicalResourceId} ${stackEvent.ResourceStatus}`);
        }
      });
    lastEventId = stackEvents[0].EventId;
  }

  if (stack.StackStatus.endsWith('_IN_PROGRESS')) {
    // stack still in progress
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(waitForAndLogEvents({ stack, lastEventId }));
      }, 5000);
    });
  } else if (stack.StackStatus.endsWith('_COMPLETE')) {
    return stack.StackStatus;
  } else if (stack.StackStatus.endsWith('_FAILED')) {
    throw new Error(`Stack failed: ${stack.StackStatusReason}`);
  } else {
    throw new Error(`Unknown status: ${stack.StackStatus}: ${stack.StackStatusReason}`);
  }
}
