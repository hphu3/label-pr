"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const core = require('@actions/core');
const github = require('@actions/github');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const myToken = core.getInput('github-token');
            const octokit = new github.GitHub(myToken);
            const owner = github.context.payload.repository.owner.login;
            const repo = github.context.payload.repository.name;
            const prNumber = github.context.payload.pull_request.number;
            console.log("owner: " + owner);
            console.log("repo: " + repo);
            console.log("pull_number: " + prNumber);
            const prReviews = yield octokit.pulls.listReviews({
                owner: github.context.payload.repository.owner.login,
                repo: github.context.payload.repository.name,
                pull_number: github.context.payload.pull_request.number
            });
            console.log(prReviews);
            for (let review of prReviews.data) {
                if (review.state === "APPROVED") {
                    console.log("approve review detected" + review);
                    const addLabel = yield octokit.issues.addLabels({
                        owner: owner,
                        repo: repo,
                        issue_number: prNumber,
                        labels: ["LG"]
                    });
                    console.log(addLabel);
                    break;
                }
            }
            ;
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
