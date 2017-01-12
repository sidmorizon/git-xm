/**
 * Created by zuozhuo on 2017/1/12.
 */
'use strict'


module.exports = {
    st: JSON.stringify(`status`),
    co: JSON.stringify(`checkout`),
    br: JSON.stringify(`branch`),
    mg: JSON.stringify(`merge`),
    ci: JSON.stringify(`commit`),
    md: JSON.stringify(`commit --amend`),
    dt: JSON.stringify(`difftool`),
    mt: JSON.stringify(`mergetool`),
    last: JSON.stringify(`log -1 HEAD`),
    cf: JSON.stringify(`config`),
    line: JSON.stringify(`log --oneline`),
    latest: JSON.stringify(`for-each-ref --sort=-committerdate --format='%(committerdate:short) %(refname:short) [%(committername)]'`),
    ls: JSON.stringify(`log --pretty=format:\"%C(yellow)%h %C(blue)%ad %C(red)%d %C(reset)%s %C(green)[%cn]\" --decorate --date=short`),
    hist: JSON.stringify(`log --pretty=format:\"%C(yellow)%h %C(red)%d %C(reset)%s %C(green)[%an] %C(blue)%ad\" --topo-order --graph --date=short`),
    type: JSON.stringify(`cat-file -t`),
    dump: JSON.stringify(`cat-file -p`),
};