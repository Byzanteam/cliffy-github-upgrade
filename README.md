# **Cliffy Github Upgrade**

Cliffy Github Upgrade is a utility library encapsulated into a repository that
is designed mainly for command updates. It leverages Github's release feature to
download packages corresponding to the local operating system (OS) and
architecture (arch) from the Github release, and replace the existing package
with them.

**Installation**

Please ensure that you have a stable release of Deno installed on your machine.

**Usage**

Below is a sample usage of ﻿Cliffy Github Upgrade:

```tsx
import {
  GithubProvider,
  GithubUpgradeCommand,
} from "../cliffy-github-upgrade/mod.ts";

//Your code...

.command(
  "upgrade",
  new GithubUpgradeCommand({
    githubProvider: new GithubProvider({ repository: "owner/repo" }),
  }),
)

//Your code...
```

In the above example, a new command ﻿upgrade is created using
﻿GithubUpgradeCommand which is aimed at upgrading the command with the new
releases found in the given repository.

Please refer to the [official documentation](https://cliffy.io) for more
details.

**Contributing**

We are always welcoming contributions.

In order to contribute, you need to have [pre-commit](https://pre-commit.com/)
installed in your system. Execute ﻿pre-commit install in your current project.

This tool makes sure that every change you want to commit passes all the tests.
It automates checks before every commit, saving you from failed builds.

Feel free to fork the repository and submit a pull request whenever you're
ready!

**License**

This project is licensed under the
[MIT license](https://opensource.org/license/mit).
