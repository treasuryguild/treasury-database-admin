import axios from 'axios'

export async function updateGitHubFile(filename, updatedTransaction, sha) {
  //const testFolderPath = "Test/"; // Replace with your test folder's name
  const apiUrl = `https://api.github.com/repos/treasuryguild/treasury-system-v4/contents/${filename}`;

  // Convert updatedTransaction object to a Base64 string
  const base64Content = btoa(JSON.stringify(updatedTransaction, null, 2));
  
  const payload = {
    message: 'Update transaction data in test folder',
    content: base64Content,
    sha: sha,
    branch: 'main',
  };

  const headers = {
    'Authorization': `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
  };

  try {
    const response = await axios.put(apiUrl, payload, { headers: headers });
    if (response.status === 200) {
      console.log('Successfully updated file in test folder', filename);
    }
    return response;
  } catch (error) {
    console.error('Error updating GitHub file:', error);
  }
}
