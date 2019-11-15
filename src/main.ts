const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const myToken = core.getInput('GITHUB_TOKEN');
    const octokit = new github.GitHub(myToken);
    console.log(github.context);

    // const prReviews = await octokit.pulls.listReviews({
    //   github.context.actor,
    //   github.context.repository,
    //   github.context.pull_request.number
    // });
    console.log("test specific workflow");
    // console.log(prReviews);
//
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
