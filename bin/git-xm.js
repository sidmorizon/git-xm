#!/usr/bin/env node --harmony

const util = require('util');
const shelljs = require('shelljs');
const program = require('commander');
const qs = require('qs');
const packageJSON = require('../package.json');
const colors = require('colors/safe');
const gitAliasList = require('./git-alias');


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
    const cmdStr = `git pull origin ${branchName} --no-edit`;
    logInfo(`拉取代码中，注意处理冲突： `, $cyan1(cmdStr));
    const execResult = shelljs.exec(cmdStr);
    if (execResult.code) {
        logError(execResult.stdout);
        return process.exit(1);
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
        return process.exit(1);
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

function setGitAlias(aliasName, command) {
    shelljs.exec(`git config --global alias.${aliasName} ${command}`);
    logInfo(`创建alias： git ${aliasName} \n  ==> git ${eval(command)}`)
}

program
    .version(VERSION)
    .option('--update-self', 'git-xm自我更新', function () {
        shelljs.exec(`npm install git-xm@latest -g`);
    })
    .option('--set-alias', '设置一些常用alias', function () {
        Object.keys(gitAliasList)
            .forEach(aliasName=>setGitAlias(aliasName, gitAliasList[aliasName]));
    })
    .option('--show-alias', '查看已设置的alias', function () {
        shelljs.exec(`git config -l | grep alias`);
    });

program.command('mr [toBranch]')
    .description(`创建当前分支到目标分支的merge request （coding.net）`)
    .action(function (toBranch) {
        // 自动创建MR https://coding.net/u/coding/pp/109336
        logInfo(`fetch远程代码`);
        shelljs.exec(`git fetch --prune origin`);
        let fromBranch = getCurrentGitBranch();
        let mrBranch = `@mr/${toBranch}/${fromBranch}`;
        const matchMRrule = new RegExp(`^\\@mr\\/${toBranch}\\/(.*)$`).exec(fromBranch);

        // 如果当前分支已经是@mr分支（常见于合并时，出现冲突后，停留在@mr分支）
        if (matchMRrule) {
            mrBranch = fromBranch;
            fromBranch = matchMRrule[1];
        }
        const codingRepoInfo = getCodingRepoInfo();
        logInfo(`
        from branch： ${$cyan1(fromBranch)} 
        @mr branch： ${$cyan1(mrBranch)}
        to branch： ${$cyan1(toBranch)}
`);
        if (!isRemoteBranchExists(toBranch)) {
            logError(`目标分支 [ ${toBranch} ] 不存在！`);
            return process.exit(1);
        }

        if (fromBranch === toBranch) {
            logError('源分支与目标分支不能相同！');
            return process.exit(1);
        }

        if (isRemoteBranchExists(fromBranch)) {
            pullOriginBranch(fromBranch);
        }

        // 开出新merge分支（如果不是@mr/开头）
        logInfo(`创建@mr临时分支: ${$cyan1(mrBranch)}`);
        shelljs.exec(`git branch -D ${mrBranch}`);
        shelljs.exec(`git checkout -B ${mrBranch}`);

        // 拉取目标分支
        pullOriginBranch(toBranch);

        // 自动提交并推送
        logInfo(`merge & commit`);
        shelljs.exec(`git commit -am"git-xm: AUTO MERGE"`);
        logInfo(`push`);
        shelljs.exec(`git push origin ${mrBranch}:${mrBranch} --force`);

        // 打开merge url
        logInfo(`打开coding的MR页面`);
        createMergeRequestUrl(codingRepoInfo.owner, codingRepoInfo.name, mrBranch, toBranch);

        // 切回原分支
        logInfo(`切回原分支： ${fromBranch}`);
        shelljs.exec(`git checkout ${fromBranch}`);
    });

program.command('rm-all-mr')
    .description(`删除所有@mr分支`)
    .option('-r,--remote ', '删除所有远程@mr分支')
    .action(function (options) {
        const rmRemote = !!options.remote;

        const cmdResult = shelljs.exec(`git branch ${rmRemote ? '-r' : ''} | grep "@mr/"`);
        if (cmdResult.code === 0) {
            const branches = cmdResult.stdout
                .split('\n')
                .map(s=>s.trim())
                .filter(s=>!!s);
            shelljs.exec(`git branch ${rmRemote ? '-r' : ''} -D ${branches.join(' ')}`);
            if (rmRemote) {
                branches.forEach(b=> {
                    b = b.replace(/^origin\//i,'');
                    shelljs.exec(`git push origin :${b}`);
                })
            }
        }

    });


// 新增自定义帮助
program.on('--help', function () {
    console.log(`
    VERSION: ${VERSION}
    GITHUB: https://github.com/zuozhuo/git-xm
    ----------------------------------------------------
    示例:

    # 创建当前分支到master的Merge Request
    $ git xm mr master
    
    # 创建当前分支到dev的Merge Request
    $ git xm mr dev
    
    # 自我更新
    $ git xm --update-self
    
    # 设置一些常用的git alias 
    # 例如：git co ==> git checkout;  git st ==> git status;  git br ==> git branch
    $ git xm --set-alias 
    # 查看已设置的alias
    $ git xm --show-alias
    
    # 查看命令帮助
    $ git xm 
    
`);

});

program.parse(process.argv);


// 没有任何参数时，默认显示帮助
if (!process.argv.slice(2).length) {
    program.outputHelp(colors.green);
}