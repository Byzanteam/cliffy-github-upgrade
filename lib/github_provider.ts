import {
  bold,
  brightBlue,
  cyan,
  green,
  red,
  Table,
  ValidationError,
  yellow,
} from "../deps.ts";

export interface Versions {
  latest: string;
  versions: Array<string>;
}

export interface UpgradeOptions {
  name: string;
  from?: string;
  to: string;
}

export interface GithubProviderOptions {
  repository: string;
  branches?: boolean;
  token?: string;
}

export interface GithubVersions extends Versions {
  tags: Array<string>;
  branches: Array<string>;
}

export class GithubProvider {
  name = "github";
  private readonly maxListSize: number = 25;
  private maxCols = 8;
  private readonly repositoryUrl = "https://github.com/";
  private readonly registryUrl = "https://raw.githubusercontent.com/";
  private readonly apiUrl = "https://api.github.com/repos/";
  private readonly repositoryName: string;
  private readonly listBranches?: boolean;
  private readonly githubToken?: string;

  constructor({ repository, branches = true, token }: GithubProviderOptions) {
    this.repositoryName = repository;
    this.listBranches = branches;
    this.githubToken = token;
  }

  async getVersions(
    _name: string,
  ): Promise<GithubVersions> {
    const [tags, branches] = await Promise.all([
      this.gitFetch<Array<{ ref: string }>>("git/refs/tags"),
      this.gitFetch<Array<{ name: string; protected: boolean }>>("branches"),
    ]);

    const tagNames = tags
      .map((tag) => tag.ref.replace(/^refs\/tags\//, ""))
      .reverse();

    const branchNames = branches
      .sort((a, b) =>
        (a.protected === b.protected) ? 0 : (a.protected ? 1 : -1)
      )
      .map((tag) =>
        `${tag.name} ${tag.protected ? `(${bold("Protected")})` : ""}`
      )
      .reverse();

    return {
      versions: [
        ...tagNames,
        ...branchNames,
      ],
      latest: tagNames[0],
      tags: tagNames,
      branches: branchNames,
    };
  }

  getRepositoryUrl(_name: string): string {
    return new URL(`${this.repositoryName}/`, this.repositoryUrl).href;
  }

  getRegistryUrl(_name: string, version: string): string {
    return new URL(`${this.repositoryName}/${version}/`, this.registryUrl).href;
  }

  async listVersions(name: string, currentVersion?: string): Promise<void> {
    const { tags, branches } = await this.getVersions(name);
    const showBranches: boolean = !!this.listBranches && branches.length > 0;
    const indent = showBranches ? 2 : 0;
    if (showBranches) {
      console.log("\n" + " ".repeat(indent) + bold(brightBlue("Tags:\n")));
    }
    this.printVersions(tags, currentVersion, { indent });
    if (showBranches) {
      console.log("\n" + " ".repeat(indent) + bold(brightBlue("Branches:\n")));
      this.printVersions(branches, currentVersion, { maxCols: 5, indent });
      console.log();
    }
  }

  private getApiUrl(endpoint: string): string {
    return new URL(`${this.repositoryName}/${endpoint}`, this.apiUrl).href;
  }

  private async gitFetch<T>(endpoint: string): Promise<T> {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (this.githubToken) {
      headers.set(
        "Authorization",
        this.githubToken ? `token ${this.githubToken}` : "",
      );
    }
    const response = await fetch(
      this.getApiUrl(endpoint),
      {
        method: "GET",
        cache: "default",
        headers,
      },
    );

    if (!response.status) {
      throw new Error(
        "couldn't fetch versions - try again after sometime",
      );
    }

    const data: GithubResponse & T = await response.json();

    if (
      typeof data === "object" && "message" in data &&
      "documentation_url" in data
    ) {
      throw new Error(data.message + " " + data.documentation_url);
    }

    return data;
  }

  private printVersions(
    versions: Array<string>,
    currentVersion?: string,
    { maxCols = this.maxCols, indent = 0 }: {
      maxCols?: number;
      indent?: number;
    } = {},
  ): void {
    versions = versions.slice();
    if (versions?.length) {
      versions = versions.map((version: string) =>
        currentVersion && currentVersion === version
          ? green(`* ${version}`)
          : `  ${version}`
      );

      if (versions.length > this.maxListSize) {
        const table = new Table().indent(indent);
        const rowSize = Math.ceil(versions.length / maxCols);
        const colSize = Math.min(versions.length, maxCols);
        let versionIndex = 0;
        for (let colIndex = 0; colIndex < colSize; colIndex++) {
          for (let rowIndex = 0; rowIndex < rowSize; rowIndex++) {
            if (!table[rowIndex]) {
              table[rowIndex] = [];
            }
            table[rowIndex][colIndex] = versions[versionIndex++];
          }
        }
        console.log(table.toString());
      } else {
        console.log(
          versions.map((version) => " ".repeat(indent) + version).join("\n"),
        );
      }
    }
  }

  async isOutdated(
    name: string,
    currentVersion: string,
    targetVersion: string,
  ): Promise<boolean> {
    const { latest, versions } = await this.getVersions(name);

    if (targetVersion === "latest") {
      targetVersion = latest;
    }

    // Check if requested version exists.
    if (targetVersion && !versions.includes(targetVersion)) {
      throw new ValidationError(
        `The provided version ${
          bold(red(targetVersion))
        } is not found.\n\n    ${
          cyan(
            `Visit ${
              brightBlue(this.getRepositoryUrl(name))
            } for available releases or run again with the ${(yellow(
              "-l",
            ))} or ${(yellow("--list-versions"))} command.`,
          )
        }`,
      );
    }

    // Check if requested version is already the latest available version.
    if (latest && latest === currentVersion && latest === targetVersion) {
      console.warn(
        yellow(
          `You're already using the latest available version ${currentVersion} of ${name}.`,
        ),
      );
      return false;
    }

    // Check if requested version is already installed.
    if (targetVersion && currentVersion === targetVersion) {
      console.warn(
        yellow(`You're already using version ${currentVersion} of ${name}.`),
      );
      return false;
    }

    return true;
  }

  async upgrade(
    { name, from, to }: UpgradeOptions,
  ): Promise<void> {
    if (to === "latest") {
      const { latest } = await this.getVersions(name);
      to = latest;
    }
    //TODO: Implement specific upgrade operations
    console.info(
      `Successfully upgraded ${name} from ${from} to version ${to}! (${
        this.getRegistryUrl(name, to)
      })`,
    );
  }
}

interface GithubResponse {
  message: string;
  documentation_url: string;
}
