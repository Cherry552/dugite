import * as chai from 'chai'
const expect = chai.expect

import { GitProcess, GitError } from '../../lib'
import { initialize } from '../helpers'
import { setupAskPass, setupNoAuth } from './auth'

const temp = require('temp').track()

describe('git-process', () => {
  describe('clone', () => {
    it('returns exit code and error when repository doesn\'t exist', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
      const options = {
        env: setupNoAuth()
      }

      // GitHub will prompt for (and validate) credentials for non-public
      // repositories, to prevent leakage of information.
      // Bitbucket will not prompt for credentials, and will immediately
      // return whether this non-public repository exists.
      //
      // This is an easier to way to test for the specific error than to
      // pass live account credentials to Git.
      const result = await GitProcess.exec([ 'clone', '--', 'https://bitbucket.org/shiftkey/testing-non-existent.git', '.'], testRepoPath, options)
      expect(result.exitCode).to.equal(128)
      const error = GitProcess.parseError(result.stderr)
      expect(error).to.equal(GitError.HTTPSRepositoryNotFound)
    })

    it('returns exit code and error when repository requires credentials', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-test-blank')
      const options = {
        env: setupAskPass('error', 'error')
      }
      const result = await GitProcess.exec([ 'clone', '--', 'https://github.com/shiftkey/repository-private.git', '.'], testRepoPath, options)
      expect(result.exitCode).to.equal(128)
      const error = GitProcess.parseError(result.stderr)
      expect(error).to.equal(GitError.HTTPSAuthenticationFailed)
    })

    it('returns exit code when successful', async () => {
      const testRepoPath = temp.mkdirSync('desktop-git-clone-valid')
      const options = {
        env: setupNoAuth()
      }
      const result = await GitProcess.exec([ 'clone', '--', 'https://github.com/shiftkey/friendly-bassoon.git', '.'], testRepoPath, options)
      expect(result.exitCode).to.equal(0)
    })
  })

  describe('fetch', () => {
    it('returns exit code and error when repository doesn\'t exist', async () => {
      const testRepoPath = await initialize('desktop-git-fetch-failure')

      // GitHub will prompt for (and validate) credentials for non-public
      // repositories, to prevent leakage of information.
      // Bitbucket will not prompt for credentials, and will immediately
      // return whether this non-public repository exists.
      //
      // This is an easier to way to test for the specific error than to
      // pass live account credentials to Git.
      const addRemote = await GitProcess.exec([ 'remote', 'add', 'origin', 'https://bitbucket.org/shiftkey/testing-non-existent.git'], testRepoPath)
      expect(addRemote.exitCode).to.equal(0)

      const options = {
        env: setupNoAuth()
      }
      const result = await GitProcess.exec([ 'fetch', 'origin' ], testRepoPath, options)
      expect(result.exitCode).to.equal(128)
      const error = GitProcess.parseError(result.stderr)
      expect(error).to.equal(GitError.HTTPSRepositoryNotFound)
    })

    it('returns exit code and error when repository requires credentials', async () => {
      const testRepoPath = await initialize('desktop-git-fetch-failure')
      const addRemote = await GitProcess.exec([ 'remote', 'add', 'origin', 'https://github.com/shiftkey/repository-private.git'], testRepoPath)
      expect(addRemote.exitCode).to.equal(0)

      const options = {
        env: setupAskPass('error', 'error')
      }
      const result = await GitProcess.exec([ 'fetch', 'origin' ], testRepoPath, options)
      expect(result.exitCode).to.equal(128)
      const error = GitProcess.parseError(result.stderr)
      expect(error).to.equal(GitError.HTTPSAuthenticationFailed)
    })

    it('returns exit code when successful', async () => {
      const testRepoPath = await initialize('desktop-git-fetch-valid')
      const addRemote = await GitProcess.exec([ 'remote', 'add', 'origin', 'https://github.com/shiftkey/friendly-bassoon.git'], testRepoPath)
      expect(addRemote.exitCode).to.equal(0)

      const options = {
        env: setupNoAuth()
      }
      const result = await GitProcess.exec([ 'fetch', 'origin' ], testRepoPath, options)
      expect(result.exitCode).to.equal(0)
    })
  })
})