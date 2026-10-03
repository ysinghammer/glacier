---
name: review-merge
description: Ask whether completed, committed branch work is ready to merge; on approval push it and open a pull request to main.
---

After branch work is finished and all implementation changes have been committed according to the `implementation-commit` skill, ask the user whether the change is ready for merging. Do not treat completion or a prior request to commit as approval to merge.

If the user says yes, push the current branch and all its commits to GitHub, then create a pull request from that branch into `main`. Include a brief description of what changed in the pull request body and give the user the pull request URL. If pushing or creating the pull request fails, report the error instead of claiming the merge is ready.

If the user says no, stop the merge workflow without pushing or creating a pull request. Do not ask again or resume it automatically; proceed only if the user later explicitly asks to merge.
