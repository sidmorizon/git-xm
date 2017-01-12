#!/usr/bin/env node --harmony

const util = require('util');
const shelljs = require('shelljs');
const program = require('commander');
const qs = require('qs');
const packageJSON = require('../package.json');
const colors = require('colors/safe');


colors.setTheme({
    cyan1: ['cyan', 'bold', 'bgBlack'],
    green1: ['green', 'bold', 'bgBlack'],
    red1: ['red', 'bold', 'bgBlack'],

});
const $cyan1 = colors.cyan1;
const $green1 = colors.green1;
const $red1 = colors.red1;

shelljs.set('-v');

const VERSION = packageJSON.version;
const MERGE_REPO_URL =
    `https://coding.net/t/%s/p/%s/git/merge/create`;

function logInfo(...args) {
    console.log.apply(this, args.map(d=>$green1(d)));
}
function logError(...args) {
    console.error.apply(this, args.map(d=>$red1(d)));
}

function getCurrentGitBranch() {
    const branchName = shelljs.exec('git symbolic-ref --short -q HEAD').stdout.trim();
    logInfo(`Current branch： ${$cyan1(branchName)} `);
    return branchName
}

function pullOriginBranch(branchName) {
    const execResult = shelljs.exec(`git pull origin ${branchName}`);
    if (execResult.code) {
        logError(execResult.stdout);
        process.exit(1);
    }
}

function isRemoteBranchExists(branchName) {
    return !!shelljs.exec(`git branch -a | egrep 'remotes/origin/${branchName}$'`).stdout.trim();
}

function getCodingRepoInfo() {
    const remoteUrl = shelljs.exec(`git config remote.origin.url`).stdout.trim();
    let gitOwner = null;
    let gitRepoName = null;
    let matched = null;
    if (/^git\@/i.test(remoteUrl)) {
        matched = /\:(.*)\/(.*)\.git$/i.exec(remoteUrl);
    }
    if (/^http/i.test(remoteUrl)) {
        matched = /coding.net\/(.*)\/(.*).git$/i.exec(remoteUrl)
    }
    if (matched) {
        gitOwner = matched[1];
        gitRepoName = matched[2];
    }
    if (!gitOwner || !gitRepoName) {
        logError(`Can not get gitOwner and gitRepoName, please check your repo config`);
        process.exit(1);
    }

    logInfo(`RepoOwner: ${$cyan1(gitOwner)}`);
    logInfo(`RepoName: ${$cyan1(gitRepoName)}`);
    return {
        owner: gitOwner,
        name: gitRepoName,
    }
}

function createMergeRequestUrl(repoOwner, repoName, fromBranch, toBranch) {
    const q = {
        startWith: fromBranch,
        endWith: toBranch,
    };
    const _url = util.format(`${MERGE_REPO_URL}?${qs.stringify(q)}`, repoOwner, repoName);

    shelljs.exec(`open "${_url}"`)
}

program
    .version(VERSION)
    .command('mr <toBranch>')
    .description(`create coding MERGE REQUEST!`)
    .action(function (toBranch) {
        // 自动创建MR https://coding.net/u/coding/pp/109336
        shelljs.exec(`git fetch --prune origin`);
        let fromBranch = getCurrentGitBranch();
        let mrBranch = `@mr/${toBranch}/${fromBranch}`;
        const matchMRrule = new RegExp(`^\\@mr\\/${toBranch}\\/(.*)$`).exec(fromBranch);
        if (matchMRrule) {
            mrBranch = fromBranch;
            fromBranch = matchMRrule[1];
        }
        const codingRepoInfo = getCodingRepoInfo();


        if (fromBranch === toBranch) {
            logError('fromBranch CAN NOT be equal to toBranch!');
            return;
        }

        if (isRemoteBranchExists(fromBranch)) {
            pullOriginBranch(fromBranch);
        }


        // 开出新merge分支（如果不是@mr/开头）
        shelljs.exec(`git branch -D ${mrBranch}`);
        shelljs.exec(`git checkout -B ${mrBranch}`);
        // 拉取目标分支
        if (isRemoteBranchExists(toBranch)) {
            pullOriginBranch(toBranch);
        } else {
            logError(`branch [ ${toBranch} ] IS NOT exists, please check!`);
            process.exit(1);
        }
        // 自动提交并推送
        shelljs.exec(`git commit -am"AUTO MERGE"`);
        shelljs.exec(`git push origin ${mrBranch}:${mrBranch} --force`);

        // 打开merge url
        createMergeRequestUrl(codingRepoInfo.owner, codingRepoInfo.name, mrBranch, toBranch);

        // 切回原分支
        shelljs.exec(`git checkout ${fromBranch}`)
    });


// 新增帮助
program.on('--help', function () {
    console.log(`  Examples:
TODO
`);
});


program.parse(process.argv);