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
const githubReviewStates = {
    approved: "APPROVED",
    changesRequested: "CHANGES_REQUESTED",
    comment: "COMMENT"
};
function labelToApply(reviews) {
    let changesRequested = {};
    let approvals = 0;
    // order matters -- later approvals cancel out earlier request changes
    // and later request changes cancel earlier approvals
    for (let review of reviews) {
        if (review.state === githubReviewStates.changesRequested) {
            changesRequested[review.user.id] = changesRequested[review.user.id] ? changesRequested[review.user.id] + 1 : 1;
        }
        else if (review.state === githubReviewStates.approved) {
            changesRequested[review.user.id] = changesRequested[review.user.id] ? changesRequested[review.user.id] - 1 : null;
            approvals += 1;
        }
    }
    let remainingChangesRequested = Object.values(changesRequested).reduce((a, b) => a + b);
    const approvedLabel = core.getInput('approved-label');
    const changesRequestedLabel = core.getInput('changes-requested-label');
    if (remainingChangesRequested > 0) {
        return changesRequestedLabel;
    }
    else if (approvals >= 1) {
        return approvedLabel;
    }
    else {
        return null;
    }
}
function labelToRemove(labelToApply) {
    return labelToApply === core.getInput('approved-label') ? core.getInput('changes-requested-label') : core.getInput('approved-label');
}
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
            const newLabel = labelToApply(prReviews.data);
            if (newLabel !== null) {
                console.log(`applying ${newLabel} to PR`);
                yield octokit.issues.addLabels({
                    owner: owner,
                    repo: repo,
                    issue_number: prNumber,
                    labels: [newLabel]
                });
                const removeLabel = labelToRemove(newLabel);
                const reviewLabels = [core.getInput('review-label'), core.getInput('re-review-label'), removeLabel];
                const removePromises = reviewLabels.map(label => {
                    return octokit.issues.removeLabel({
                        owner: owner,
                        repo: repo,
                        issue_number: prNumber,
                        name: label
                    });
                });
                console.log(`removing ${reviewLabels.join(", ")} from PR`);
                yield Promise.all(removePromises).catch((err) => console.log(`Error deleting label ${err}`));
            }
        }
        catch (error) {
            console.error(error);
            core.setFailed(error.message);
        }
    });
}
run();
