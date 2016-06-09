import AWS from 'aws-sdk';
import _ from 'lodash';

import { log } from './util/log';

export const cfn = new AWS.CloudFormation({
  apiVersion: '2010-05-15',
  region: 'us-east-1',
});

export async function listAllResources({ stackName, nextToken }) {
  const { StackResourceSummaries: resources, NextToken: nextNextToken } =
    await cfn.listStackResources({ StackName: stackName, NextToken: nextToken }).promise();

  if (nextNextToken) {
    const moreResources = await listAllResources({ stackName, nextToken: nextNextToken });
    return resources.concat(moreResources);
  }

  return resources;
}

export async function waitForAndLogEvents({ stackName }) {
  log.debug({ stackName }, 'Getting stack id');
  const { Stacks: [{ StackId: stackId }] } =
    await cfn.describeStacks({ StackName: stackName }).promise();
  log.debug({ stackName }, 'Getting initial events');
  const rawEvents = await cfn.describeStackEvents({ StackName: stackName }).promise();
  log.trace({ rawEvents }, 'Raw events');
  let lastEventId = _.get(rawEvents, 'StackEvents[0].EventId');

  return new Promise((resolve, reject) => {
    async function poll() {
      try {
        log.trace({ stackName }, 'Describing stack');
        // capture stack status prior to events, otherwise we might miss the last few events
        const { Stacks: [stack] } =
          await cfn.describeStacks({ StackName: stackId }).promise();

        // describe events by id, since by name fails when waiting for delete
        log.trace({ stackName }, 'Describing stack events');
        let { StackEvents: stackEvents } =
          await cfn.describeStackEvents({ StackName: stackId }).promise();
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

        log.trace({ stackName, stack: _.pick(stack, ['StackStatus', 'StackStatusReason']) },
          'Processing status');
        switch (stack.StackStatus) {
          case 'CREATE_IN_PROGRESS':
          case 'ROLLBACK_IN_PROGRESS':
          case 'DELETE_IN_PROGRESS':
          case 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS':
          case 'UPDATE_IN_PROGRESS':
          case 'UPDATE_ROLLBACK_IN_PROGRESS':
          case 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS':
            // stack still in progress
            break;

          case 'CREATE_COMPLETE':
          case 'ROLLBACK_COMPLETE':
          case 'DELETE_COMPLETE':
          case 'UPDATE_COMPLETE':
          case 'UPDATE_ROLLBACK_COMPLETE':
            resolve(stack);
            return;

          case 'CREATE_FAILED':
          case 'ROLLBACK_FAILED':
          case 'DELETE_FAILED':
          case 'UPDATE_ROLLBACK_FAILED':
            reject(new Error(`Stack failed: ${stack.StackStatusReason}`));
            return;

          default:
            reject(
              new Error(`Unknown status: ${stack.StackStatus}: ${stack.StackStatusReason}`));
            return;
        }

        // not done yet; try again later
        setTimeout(poll, 5000);
      } catch (err) {
        reject(err);
      }
    }

    // kick off the polling
    setTimeout(poll, 5000);
  });
}

export const describeStack = _.memoize(async stackName => {
  log.debug({ stackName }, 'describing stack');
  try {
    const data = await cfn.describeStacks({ StackName: stackName }).promise();
    return _.get(data, 'Stacks[0]');
  } catch (err) {
    // validation errors are when the stack isn't found; otherwise rethrow
    if (_.get(err, 'code') === 'ValidationError') {
      return null;
    }

    throw err;
  }
});
