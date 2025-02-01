#! /usr/bin/env node
import { Octokit } from '@octokit/rest'

const owner = process.env.REPO_OWNER || process.env.PLUGIN_REPO_OWNER
const repo = process.env.REPO_NAME || process.env.PLUGIN_REPO_NAME
const pull_number: number =
  parseInt(process.env.PR_NUMBER) || parseInt(process.env.PLUGIN_PR_NUMBER)
const message: string = process.env.PR_MESSAGE || process.env.PLUGIN_PR_MESSAGE
const githubToken: string =
  process.env.GITHUB_TOKEN || process.env.PLUGIN_GITHUB_TOKEN

const commitSha = process.env.COMMIT_SHA || process.env.PLUGIN_COMMIT_SHA

const octokit = new Octokit({ auth: githubToken })

const createMessagePreviewEnvironment = (
  commitSha?: string,
  repo?: string,
  url?: string,
  owner?: string
): string => {
  const message = `
✅ **Deploy Preview Environment ready!**

| Name                | Link                                                                                               |
|---------------------|----------------------------------------------------------------------------------------------------|
| 🔨 **Latest commit** | [${commitSha}](https://github.com/${owner}/${repo}/commit/${commitSha})                                                    |
| 😎 **Deploy Preview** | [${url}](${url})     |
`
  return message
}

export async function checkAndCreateComment(
  owner: string,
  repo: string,
  pull_number: number,
  message: string,
  commitSha: string
) {
  const { data: comments } = await octokit.issues.listComments({
    owner: owner,
    repo: repo,
    issue_number: pull_number
  })

  let rocketComment = null

  for (const comment of comments) {
    const { data: reactions } = await octokit.reactions.listForIssueComment({
      owner,
      repo,
      comment_id: comment.id
    })

    if (reactions.some(reaction => reaction.content === 'rocket')) {
      rocketComment = comment
      break
    }
  }

  if (rocketComment) {
    const updatedBody = rocketComment.body.replace(
      /Latest commit \*\*\[.*?\]\(.*?\)\*\*/i,
      `Latest commit **[${commitSha}](https://github.com/${owner}/${repo}/commit/${commitSha})**`
    )

    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: rocketComment.id,
      body: updatedBody
    })
    console.log('Comment updated with latest commit')
  } else {
    const newComment = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: createMessagePreviewEnvironment(commitSha, repo, message, owner)
    })
    await octokit.reactions.createForIssueComment({
      owner,
      repo,
      comment_id: newComment.data.id,
      content: 'rocket'
    })
    console.log('Comment created')
  }
}

checkAndCreateComment(owner, repo, pull_number, message, commitSha)
