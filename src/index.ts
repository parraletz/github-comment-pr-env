import * as core from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from '@octokit/rest'

const context = github.context
const { repo, owner } = context.repo

const pull_number =
  process.env.PR_NUMBER ||
  process.env.PLUGIN_PR_NUMBER ||
  github.context.payload.pull_request?.number ||
  github.context.payload.issue?.number

const message: string =
  process.env.PR_MESSAGE ||
  process.env.PLUGIN_PR_MESSAGE ||
  core.getInput('message')

const githubToken: string =
  process.env.GITHUB_TOKEN ||
  process.env.PLUGIN_GITHUB_TOKEN ||
  core.getInput('github_token')

const commitSha =
  process.env.COMMIT_SHA || process.env.PLUGIN_COMMIT_SHA || github.context.sha

const octokit = new Octokit({ auth: githubToken })

const isValidUrl = (url?: string): boolean => {
  return !!url && /^(https?:\/\/)/.test(url)
}

const createMessagePreviewEnvironment = (
  commitSha?: string,
  repo?: string,
  msg?: string,
  owner?: string
): string => {
  if (commitSha) {
    if (!isValidUrl(msg)) {
      throw new Error('Invalid URL provided for msg')
    }

    const message = `
    ✅ **Deploy Preview Environment ready!**
    
    | Name                | Link                                                                                               |
    |---------------------|----------------------------------------------------------------------------------------------------|
    | 🔨 **Latest commit** | [${commitSha.substring(0, 7)}](https://github.com/${owner}/${repo}/commit/${commitSha.substring(0, 7)})                                                    |
    | 😎 **Deploy Preview** | [${msg}](${msg})     |
    `
    return message
  }

  return msg ?? ''
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
  core.info(`Checking existing comments in PR #${pull_number}`)

  if (rocketComment && rocketComment.body) {
    const updatedBody = rocketComment.body.replace(
      /Latest commit \*\*\[.*?\]\(.*?\)\*\*/i,
      `Latest commit **[${commitSha.substring(0, 7)}](https://github.com/${owner}/${repo}/commit/${commitSha.substring(0, 7)})**`
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

checkAndCreateComment(owner, repo, Number(pull_number), message, commitSha)
