"""README cleaning: Markdown -> plain text.

Keeps headings and prose, which is where a project says what it does. Removes what would only add
noise to the index: badges, images, HTML tags, comments, code (blocks and inline), link URLs (the
link text stays), tables of contents and emoji shortcodes.

Why regex first, then Markdown → HTML → text: Markdown inside an HTML block (`<div align="center">`
followed by badges) is *not* parsed by the Markdown library, so a plain Markdown → text pass leaves
the badge links in. Found on inventree/InvenTree in Phase 1.
"""

from __future__ import annotations

import re

import markdown
from bs4 import BeautifulSoup

_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
_FENCE = re.compile(r"^(```|~~~).*?^\1[^\n]*$", re.DOTALL | re.MULTILINE)
_BADGE = re.compile(r"\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)")            # [![alt](img)](link)
_IMAGE = re.compile(r"!\[[^\]]*\]\([^)]*\)")                         # ![alt](img)
_IMAGE_REF = re.compile(r"!\[[^\]]*\]\[[^\]]*\]")                    # ![alt][ref]
_TOC_LINE = re.compile(r"^\s*(?:[-*+]|\d+\.)\s*\[[^\]]+\]\(#[^)]*\)\s*$", re.MULTILINE)   # - [Intro](#intro)
_LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")                         # [text](url) -> text
_LINK_REF = re.compile(r"\[([^\]]+)\]\[[^\]]*\]")                    # [text][ref] -> text
_REF_DEF = re.compile(r"^\s*\[[^\]]+\]:\s*\S+.*$", re.MULTILINE)             # [ref]: https://…
_INLINE_CODE = re.compile(r"`[^`\n]*`")
_URL = re.compile(r"(?:https?://|www\.)\S+")
_EMOJI = re.compile(r":[a-z0-9_+\-]{2,30}:")                          # :star2:, :rocket:
_TOC_HEADING = re.compile(r"^\s*(table of contents|contents|toc)\s*$", re.IGNORECASE)


def _drop_toc_sections(soup: BeautifulSoup) -> None:
    """A heading called 'Table of contents' / 'Contents' and the list right after it."""
    for h in soup.find_all(re.compile(r"^h[1-6]$")):
        if _TOC_HEADING.match(h.get_text(" ", strip=True)):
            nxt = h.find_next_sibling()
            if nxt is not None and nxt.name in ("ul", "ol"):
                nxt.decompose()
            h.decompose()


def clean_readme(markdown_text: str) -> str:
    """Remove badges, images, HTML, code blocks, tables of contents and link URLs;
    keep headings and prose (that is where the features are described)."""
    if not markdown_text:
        return ""
    t = markdown_text.replace("\r\n", "\n")
    t = _COMMENT.sub(" ", t)
    t = _FENCE.sub(" ", t)
    t = _BADGE.sub(" ", t)
    t = _IMAGE.sub(" ", t)
    t = _IMAGE_REF.sub(" ", t)
    t = _TOC_LINE.sub("", t)
    t = _LINK.sub(r"\1", t)
    t = _LINK_REF.sub(r"\1", t)
    t = _REF_DEF.sub("", t)
    t = _INLINE_CODE.sub(" ", t)

    soup = BeautifulSoup(markdown.markdown(t, extensions=["tables"]), "html.parser")
    for tag in soup.find_all(["pre", "code", "img", "svg", "script", "style"]):
        tag.decompose()
    _drop_toc_sections(soup)
    for tag in soup.find_all(["td", "th"]):              # inline tags (bold, links) stay inside their sentence;
        tag.append(" ")                                  # only blocks end a line
    for tag in soup.find_all(["p", "li", "tr", "br", "div", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"]):
        tag.append("\n")
    text = soup.get_text("")

    text = _URL.sub(" ", text)
    text = _EMOJI.sub(" ", text)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    out, blank = [], False
    for line in lines:                                   # keep one blank line between blocks
        if line:
            out.append(line)
            blank = False
        elif not blank and out:
            out.append("")
            blank = True
    return "\n".join(out).strip()
