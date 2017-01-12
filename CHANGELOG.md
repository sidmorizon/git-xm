

## 1.0.8

- 修复目标分支如果输错了（如master输入了maste），会生成一个屎分支的bug
- 直接输入`git xm`即可查看帮助
- 增加`git xm --update-self`自我更新命令
- 增加`git xm --set-alias`创建常用alias，例如`git co ==> git checkout;  git st ==> git status;  git br ==> git branch`
- 优化控制台输错信息


## 1.0.0

- `git xm mr <toBranch>`命令行创建当前分支到目标分支的Merge Request 