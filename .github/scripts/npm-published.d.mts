type Runner = (
  file: string,
  args: string[],
  options: { encoding: string; timeout: number; stdio: string },
) => string

export function isPublished(name: string, version: string, run?: Runner): boolean
export function assertPublishedTarball(name: string, version: string, tarball: string, run?: Runner): void

export const EXIT_PUBLISHED: 0
export const EXIT_NOT_PUBLISHED: 1
export const EXIT_USAGE_ERROR: 2
export const EXIT_UNEXPECTED_ERROR: 3

export function exitCodeFor(
  name: string | undefined,
  version: string | undefined,
  checkPublished?: (name: string, version: string) => boolean,
): 0 | 1 | 2 | 3
