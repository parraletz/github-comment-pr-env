 # PR Preview Commenter

This GitHub Action posts or updates a comment in a pull request (PR) with a link to the preview environment. 

## Usage

To use the action, you need to define it in your workflow `.yml` file within the `.github/workflows` directory in your repository.

```yaml
jobs:
  preview_comment:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v2
    - name: Post PR Preview Comment
      uses: ./  # Use the local action defined in your repository
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        repo_owner: ${{ github.repository_owner }}
        repo_name: ${{ github.event.repository.name }}
        pr_number: ${{ github.event.pull_request.number }}
        pr_message: "Your preview environment is ready!"
        commit_sha: ${{ github.sha }}
```

## Inputs

- **`github_token`**: (Required) GitHub token for authentication. Typically set to `${{ secrets.GITHUB_TOKEN }}`.
- **`repo_owner`**: (Optional) The owner of the repository. If not provided, defaults to the context repository owner.
- **`repo_name`**: (Required) The name of the repository.
- **`pr_number`**: (Required) The pull request number.
- **`pr_message`**: (Required) The message to include in the PR comment about the preview environment.
- **`commit_sha`**: (Required) The commit SHA related to the preview environment.

## Author

Alex Parra

## Branding

- **Icon**: `message-square`
- **Color**: `blue`

## License

This project is licensed under the MIT License.