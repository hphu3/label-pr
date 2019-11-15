const core = require('@actions/core');
const github = require('@actions/github');

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
    console.log(prReviews);

    for (let review of prReviews.data) {
      if (review.state === "APPROVED") {
        console.log("approve review detected" + review)

        const addLabel = await octokit.issues.addLabels({
          owner: owner,
          repo: repo,
          issue_number: prNumber,
          labels: ["LG"]
        });
        console.log(addLabel);

        break;
      }
    };

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
