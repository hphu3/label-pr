const core = require('@actions/core');
const github = require('@actions/github');

const githubReviewStates = {
  approved: "APPROVED",
  changesRequested: "CHANGES_REQUESTED",
  comment: "COMMENT"
}

function labelToApply(reviewStates) {
  const changesRequested = reviewStates.includes(githubReviewStates.changesRequested)
  const approved = reviewStates.includes(githubReviewStates.approved)

  if (changesRequested) {
    return "Reviewed";
  } else if (approved) {
    return "LG";
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

    const reviewStates = prReviews.data.map(review => review.state);

    if (labelToApply !== null) {
      await octokit.issues.addLabels({
        owner: owner,
        repo: repo,
        issue_number: prNumber,
        labels: [labelToApply(reviewStates)]
      });
    }
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}

run();
