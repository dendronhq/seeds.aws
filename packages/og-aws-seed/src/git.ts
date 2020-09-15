import git  from 'nodegit' 
import fs  from 'fs-extra' 

export class GitRepo {
  constructor(public opts: {localUrl: string, remoteUrl: string}) {
  }

  async checkout() {
      const {localUrl, remoteUrl} = this.opts
      fs.ensureDirSync(localUrl);
      return await git.Clone.clone(remoteUrl, localUrl);
  }
}