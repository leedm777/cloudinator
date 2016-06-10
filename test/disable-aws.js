// point AWS to a non-existent profile, so we don't accidentally do anything
// we might regret during the tests

process.env.AWS_PROFILE = 'B472DFBB-C243-4F35-B9CD-4A0414A0B177';
// process.env.AWS_PROFILE = 'cirrus';
