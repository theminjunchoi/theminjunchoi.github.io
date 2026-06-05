const visit = require("unist-util-visit");
const path = require("path");

// Converts Obsidian image embeds `![[filename.png]]` into markdown image nodes.
// Emits a path RELATIVE to the current markdown file (resolved to the real File
// node under contents/posts/attachments) so that `gatsby-remark-images`, which
// runs after this plugin, can pick the image up and optimize it.
// (An absolute `/attachments/...` url would be skipped by gatsby-remark-images.)
module.exports = ({ markdownAST, markdownNode, files }) => {
  const markdownDir =
    markdownNode && markdownNode.fileAbsolutePath
      ? path.dirname(markdownNode.fileAbsolutePath)
      : null;

  const resolveUrl = (link) => {
    // Fall back to the previous absolute path if we can't resolve the file
    // (keeps an unknown reference from silently disappearing).
    if (!markdownDir || !Array.isArray(files)) return `/attachments/${link}`;

    const target = files.find(
      (file) =>
        file.base === link &&
        file.absolutePath.includes(`${path.sep}attachments${path.sep}`)
    );
    if (!target) return `/attachments/${link}`;

    let relative = path.relative(markdownDir, target.absolutePath);
    if (!relative.startsWith(".")) relative = `./${relative}`;
    return relative;
  };

  visit(markdownAST, "text", (node, index, parent) => {
    const { value } = node;

    // 텍스트 노드에서 ![[상대 링크]] 패턴을 찾습니다.
    const matches = Array.from(value.matchAll(/!\[\[([^\]]+)\]\]/g));

    if (matches.length > 0) {
      // 변경할 노드들을 저장할 배열
      const newNodes = [];

      // 마지막 매치의 끝 위치
      let lastEnd = 0;

      matches.forEach((match) => {
        const [wholeMatch, link] = match;
        const start = match.index;
        const end = start + wholeMatch.length;

        // 매치 이전의 텍스트를 추가
        if (start > lastEnd) {
          newNodes.push({
            type: "text",
            value: value.slice(lastEnd, start),
          });
        }

        // 매치를 이미지 노드로 변환 (마크다운 파일 기준 상대 경로)
        newNodes.push({
          type: "image",
          url: resolveUrl(link),
          alt: link,
        });

        lastEnd = end;
      });

      // 마지막 매치 이후의 텍스트를 추가
      if (lastEnd < value.length) {
        newNodes.push({
          type: "text",
          value: value.slice(lastEnd),
        });
      }

      // 부모 노드의 children 배열을 수정
      parent.children.splice(index, 1, ...newNodes);
    }
  });
};
