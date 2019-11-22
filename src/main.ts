const core = require('@actions/core');
const github = require('@actions/github');

const githubReviewStates = {
  approved: "APPROVED",
  changesRequested: "CHANGES_REQUESTED",
  comment: "COMMENT"
}

function labelToApply(reviews) {
  let changesRequested: object = {};
  let approvals: number = 0;

  // order matters -- later approvals cancel out earlier request changes
  // and later request changes cancel earlier approvals
  for (let review of reviews){
    if (review.state === githubReviewStates.changesRequested) {
      changesRequested[review.user.id] = changesRequested[review.user.id] ? changesRequested[review.user.id] + 1 : 1;
    } else if (review.state === githubReviewStates.approved) {
      changesRequested[review.user.id] = changesRequested[review.user.id] ? changesRequested[review.user.id] - 1 : null;
      approvals += 1;
    }
  }

  let remainingChangesRequested: number = Object.values(changesRequested).reduce((a, b) => a + b);

  const approvedLabel = core.getInput('approved-label');
  const changesRequestedLabel = core.getInput('changes-requested-label');

  if (remainingChangesRequested > 0) {
    return changesRequestedLabel;
  } else if (approvals >= 1) {
    return approvedLabel;
  } else {
    return null;
  }
}

async function run() {
  try {
    const myToken = core.getInput('github-token');
    const octokit = new github.GitHub(myToken);

    const owner = github.context.payload.repository.owner.login;
    const repo = github.context.payload.repository.name;
    const prNumber = github.context.payload.pull_request.number

    console.log("owner: " + owner);
    console.log("repo: " + repo);
    console.log("pull_number: " + prNumber);

    const prReviews = await octokit.pulls.listReviews({
      owner: github.context.payload.repository.owner.login,
      repo: github.context.payload.repository.name,
      pull_number: github.context.payload.pull_request.number
    });

    const newLabel = labelToApply(prReviews.data);
    if (newLabel !== null) {
      await octokit.issues.addLabels({
        owner: owner,
        repo: repo,
        issue_number: prNumber,
        labels: [newLabel]
      });
    }
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}

run();
