## 1.1.3

- 增加`git xm rm-all-mr`删除所有本地的`@mr`分支
    - `git xm rm-all-mr -r`删除所有远程的`@mr`分支


## 1.1.1

- 修复bug：目标分支如果输错了（如`master`输成了`maste`），会创建一个屎分支
- 直接输入`git xm`即可查看帮助
- 增加`git xm --update-self`自我更新命令
- 增加`git xm --set-alias`创建常用alias，例如`git co ==> git checkout;  git st ==> git status;  git br ==> git branch`
- 增加`git xm --show-alias`查看当前设置的alias
- 代码迁移到 https://github.com/zuozhuo/git-xm
- 优化控制台输错信息


## 1.0.0

- `git xm mr <toBranch>`命令行创建当前分支到目标分支的Merge Request 