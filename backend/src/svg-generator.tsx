import * as React from 'react';
import ghLanguageColors from 'gh-language-colors';
// import {highlight, highlightAuto} from 'highlight.js';
// import SyntaxHighlighter from 'react-syntax-highlighter';
// const Refractor = require('react-refractor');
const refractor = require('refractor');
// const py = require('refractor/lang/python');
// const js = require('refractor/lang/javascript');
// import 'react-refractor/all'

// Refractor.registerLanguage(py)
// Refractor.registerLanguage(js)

import { renderEmoji } from './emoji-renderer';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// TODO: Make it declarative
// TODO: Support non-English description
function descriptionToLines (description: string): readonly string[] {
  const splitter = ' ';
  const words = description.split(splitter);
  let line: string = '';
  const lines: string[] = [];
  for (const word of words) {
    line += word + splitter;
    if (line.length > 55) {
      lines.push(line);
      line = '';
    }
  }
  if (line !== '') {
    lines.push(line);
  }
  return lines;
}

// GitHub number string for stars and forks
function gitHubNumberString (n: number): string {
  if (n < 950) {
    return n.toString();
  }
  const k = n / 1000;
  if (k < 99.9) {
    return k.toFixed(1) + 'k';
  }
  return `${Math.round(k)}k`;
}

function calculateLineWidth (text: string): number {
  return [...text].reduce((x, y) => x + (y.match(/[\x00-\xFF]/) ? 1 : 2), 0);
}

function substringUnicodeString (unicodeText: string, start: number, end: number): string {
  return [...unicodeText].slice(start, end).join('');
}

function ellipsisByWidth (unicodeText: string, width: number, ellipsisText: string = '...'): string {
  if (calculateLineWidth(unicodeText) <= width) return unicodeText;
  let end = 1;
  while (calculateLineWidth(substringUnicodeString(unicodeText, 0, end))
        <= width) ++end;
  return substringUnicodeString(unicodeText, 0, end - 1).concat(ellipsisText);
}

function getGitHubRepositoryUrl (ownerName: string, shortRepoName: string): string {
  return `https://github.com/${ownerName}/${shortRepoName}`;
}

function getGitHubStargazersUrl (ownerName: string, shortRepoName: string): string {
  return `https://github.com/${ownerName}/${shortRepoName}/stargazers`;
}

function getGitHubNetworkMemberUrl (ownerName: string, shortRepoName: string): string {
  return `https://github.com/${ownerName}/${shortRepoName}/network/members`;
}

function getGitHubGistUrl (gistId: string): string {
  return `https://gist.github.com/${gistId}`;
}

export function generateSvg (
    { ownerName, shortRepoName, usesFullName: usesFullName, linkTarget, language, description, nStars, nForks, isFork }:
    {ownerName: string, shortRepoName: string, usesFullName: boolean, linkTarget: string, language: string | undefined, description: string, nStars: number, nForks: number, isFork: boolean}
  ): {width: number, height: number, svg: JSX.Element} {
  // Name on image
  const repoNameInImage: string = usesFullName ? `${ownerName}/${shortRepoName}` : shortRepoName;
  // Get language color
  const colors: {[lang: string]: string} = ghLanguageColors;
  const languageColor: string | undefined = (language === undefined) ? undefined : colors[language];
  // Convert description to lines
  const descriptionLines: readonly string[] = descriptionToLines(
    renderEmoji(description)
  );
  // Create description element and last y coordinate
  const [descriptionElems, lastDescriptionY] = (() => {
    let y = 65;
    const diff = 21;
    const elem: JSX.Element[] = descriptionLines.map((line: string) => {
      const e: JSX.Element = (
        <g fill='#586069' fill-opacity='1' stroke='#586069' stroke-opacity='1' stroke-width='1' stroke-linecap='square' stroke-linejoin='bevel' transform='matrix(1,0,0,1,0,0)'>
          <text fill='#586069' fill-opacity='1' stroke='none' {...{ 'xml:space': 'preserve' }} x='17' y={y} font-family='sans-serif' font-size='14' font-weight='400' font-style='normal'>{line}</text>
        </g>
      );
      y += diff;
      return e;
    });

    return [elem, y - diff] as const;
  })();

  // Define board's width
  const width = 442;
  // Define board's height
  const height = lastDescriptionY + 43;
  // X coordinate next to language
  const languageNextX: number = (language === undefined) ? 16 : 60 + (5 * language.length);

  // Star icon
  const starIcon = (<a target={linkTarget} href={getGitHubStargazersUrl(ownerName, shortRepoName)}><path vector-effect='none' fill-rule='evenodd' d='M14,6 L9.1,5.36 L7,1 L4.9,5.36 L0,6 L3.6,9.26 L2.67,14 L7,11.67 L11.33,14 L10.4,9.26 L14,6' /></a>);
  // Fork icon
  const forkIcon = (<a target={linkTarget} href={getGitHubNetworkMemberUrl(ownerName, shortRepoName)}><path vector-effect='none' fill-rule='evenodd' d='M10,5 C10,3.89 9.11,3 8,3 C7.0966,2.99761 6.30459,3.60318 6.07006,4.47561 C5.83554,5.34804 6.21717,6.2691 7,6.72 L7,7.02 C6.98,7.54 6.77,8 6.37,8.4 C5.97,8.8 5.51,9.01 4.99,9.03 C4.16,9.05 3.51,9.19 2.99,9.48 L2.99,4.72 C3.77283,4.2691 4.15446,3.34804 3.91994,2.47561 C3.68541,1.60318 2.8934,0.997613 1.99,1 C0.88,1 0,1.89 0,3 C0.00428689,3.71022 0.384911,4.3649 1,4.72 L1,11.28 C0.41,11.63 0,12.27 0,13 C0,14.11 0.89,15 2,15 C3.11,15 4,14.11 4,13 C4,12.47 3.8,12 3.47,11.64 C3.56,11.58 3.95,11.23 4.06,11.17 C4.31,11.06 4.62,11 5,11 C6.05,10.95 6.95,10.55 7.75,9.75 C8.55,8.95 8.95,7.77 9,6.73 L8.98,6.73 C9.59,6.37 10,5.73 10,5 M2,1.8 C2.66,1.8 3.2,2.35 3.2,3 C3.2,3.65 2.65,4.2 2,4.2 C1.35,4.2 0.8,3.65 0.8,3 C0.8,2.35 1.35,1.8 2,1.8 M2,14.21 C1.34,14.21 0.8,13.66 0.8,13.01 C0.8,12.36 1.35,11.81 2,11.81 C2.65,11.81 3.2,12.36 3.2,13.01 C3.2,13.66 2.65,14.21 2,14.21 M8,6.21 C7.34,6.21 6.8,5.66 6.8,5.01 C6.8,4.36 7.35,3.81 8,3.81 C8.65,3.81 9.2,4.36 9.2,5.01 C9.2,5.66 8.65,6.21 8,6.21 ' /></a>);

  const svg = (
    <svg xmlns='http://www.w3.org/2000/svg' {...{ 'xmlns:xlink': 'http://www.w3.org/1999/xlink' }} width={width} height={height + 1} version='1.2' baseProfile='tiny'>
      <defs />
      <g fill='none' stroke='black' stroke-width='1' fill-rule='evenodd' stroke-linecap='square' stroke-linejoin='bevel'>
          <g fill='#ffffff' fill-opacity='1' stroke='none' transform='matrix(1,0,0,1,0,0)'>
            <rect x='0' y='0' width='440' height={height + 1} />
          </g>
          {/* Boarder */}
          <rect x='0' y='0' width='441' height={height} stroke='#eaecef' stroke-width='2' />
          <g fill='#586069' fill-opacity='1' stroke='none' transform='matrix(1.25,0,0,1.25,17,21)'>
            {
              (isFork)
                // Fork icon
                ? <path fill-rule='evenodd' d='M8 1a1.993 1.993 0 00-1 3.72V6L5 8 3 6V4.72A1.993 1.993 0 002 1a1.993 1.993 0 00-1 3.72V6.5l3 3v1.78A1.993 1.993 0 005 15a1.993 1.993 0 001-3.72V9.5l3-3V4.72A1.993 1.993 0 008 1zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3 10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3-10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z'></path>
                // Repo icon like book
                : <path vector-effect='none' fill-rule='evenodd' d='M4,9 L3,9 L3,8 L4,8 L4,9 M4,6 L3,6 L3,7 L4,7 L4,6 M4,4 L3,4 L3,5 L4,5 L4,4 M4,2 L3,2 L3,3 L4,3 L4,2 M12,1 L12,13 C12,13.55 11.55,14 11,14 L6,14 L6,16 L4.5,14.5 L3,16 L3,14 L1,14 C0.45,14 0,13.55 0,13 L0,1 C0,0.45 0.45,0 1,0 L11,0 C11.55,0 12,0.45 12,1 M11,11 L1,11 L1,13 L3,13 L3,12 L6,12 L6,13 L11,13 L11,11 M11,1 L2,1 L2,10 L11,10 L11,1' />
            }
          </g>
          <g fill='#0366d6' fill-opacity='1' stroke='#0366d6' stroke-opacity='1' stroke-width='1' stroke-linecap='square' stroke-linejoin='bevel' transform='matrix(1,0,0,1,0,0)'>
            {/* Repo name */}
            <a target={linkTarget} href={getGitHubRepositoryUrl(ownerName, shortRepoName)}>
              <text fill='#0366d6' fill-opacity='1' stroke='none' {...{ 'xml:space': 'preserve' }} x='41' y='33' font-family='sans-serif' font-size='16' font-weight='630' font-style='normal'>{repoNameInImage}</text>
            </a>
          </g>
          {/* Description */}
          {descriptionElems}
          {
            (language === undefined) ?
            undefined :
            // Language
            <g fill='#24292e' fill-opacity='1' stroke='#24292e' stroke-opacity='1' stroke-width='1' stroke-linecap='square' stroke-linejoin='bevel' transform='matrix(1,0,0,1,0,0)'>
              <text fill='#24292e' fill-opacity='1' stroke='none' {...{ 'xml:space': 'preserve' }} x='33' y={lastDescriptionY + 26} font-family='sans-serif' font-size='12' font-weight='400' font-style='normal'>{language}</text>
            </g>
          }
          {/* <!-- Star or Fork icon or none --> */}
          <g fill='#000000' fill-opacity='1' stroke='none' transform={`matrix(1,0,0,1,${languageNextX},${lastDescriptionY + 13})`}>{
            (() => {
              if (nStars > 0) {
                return starIcon;
              } else if (nForks > 0) {
                return forkIcon;
              } else {
                return undefined;
              }
            })()
          }</g>
          <g fill='#586069' fill-opacity='1' stroke='#586069' stroke-opacity='1' stroke-width='1' stroke-linecap='square' stroke-linejoin='bevel' transform='matrix(1,0,0,1,0,0)'>
            {/* The number of stars or fork */}
            {(() => {
              // Url & Number of stars or forks
              const urlAndNumberStr: readonly [string, string] | undefined = (() => {
                if (nStars > 0) {
                  return [getGitHubStargazersUrl(ownerName, shortRepoName), gitHubNumberString(nStars)] as const;
                } else if (nForks > 0) {
                  return [getGitHubNetworkMemberUrl(ownerName, shortRepoName), gitHubNumberString(nForks)] as const;
                } else {
                  return undefined;
                }
              })();

              if (urlAndNumberStr === undefined) {
                return undefined;
              } else {
                const [url, numberStr] = urlAndNumberStr;
                return (
                  <a target={linkTarget} href={url}>
                    <text fill='#586069' fill-opacity='1' stroke='none' {...{ 'xml:space': 'preserve' }} x={languageNextX + 21} y={lastDescriptionY + 26} font-family='sans-serif' font-size='12' font-weight='400' font-style='normal'>{
                      numberStr
                    }</text>
                  </a>
                );
              }
            })()}
          </g>

          {/* Fork icon or none */}
          <g fill='#000000' fill-opacity='1' stroke='none' transform={`matrix(1,0,0,1,${languageNextX + 63},${lastDescriptionY + 13})`}>{
            (nStars > 0 && nForks > 0) ? forkIcon : undefined
          }</g>
          <g fill='#586069' fill-opacity='1' stroke='#586069' stroke-opacity='1' stroke-width='1' stroke-linecap='square' stroke-linejoin='bevel' transform='matrix(1,0,0,1,0,0)'>
            {/* The number of forks or none */}
            {
              (nStars > 0 && nForks > 0) ?
                <a target={linkTarget} href={`${getGitHubNetworkMemberUrl(ownerName, shortRepoName)}`}>
                  <text fill='' fill-opacity='1' stroke='none' {...{ 'xml:space': 'preserve' }} x={languageNextX + 80} y={lastDescriptionY + 26} font-family='sans-serif' font-size='12' font-weight='400' font-style='normal'>{gitHubNumberString(nForks)}</text>
                </a>
                : undefined
            }
          </g>
          {
            (languageColor === undefined) ?
              undefined :
              // Language color
              <circle cx='23' cy={`${lastDescriptionY + 21}`} r='7' stroke='none' fill={`${languageColor}`}/>
          }
      </g>
    </svg>
  );
  return {
    width,
    height,
    svg
  };
}

export function generateGistSvg (
    { gistId, linkTarget, mimeType, filename, content, isImage, imgWidth, imgHeight }:
      {gistId: string, linkTarget: string, mimeType: string, filename: string, content: string, isImage: boolean, imgWidth: number | undefined, imgHeight: number | undefined}
  ): {width: number, height: number, svg: JSX.Element} {

  let codeElems: JSX.Element[] | undefined;

  // Define board's width
  const width = 442;
  // Define board's height
  let height;
  let lastCodeY;

  const getTypeFromMime = (mime: string) => (mime.split('/').pop() || '').replace(/^x-/, '');
  if (isImage) {
    height = 80 + (imgHeight !== undefined ? imgHeight : 100) + 17;
  } else {
    const [codes, lastY] = (() => {
      const mapComponent = (component: any) => {
        component.tagName = 'tspan';
        if (component.children) {
          component.children = component.children.map(mapComponent);
        }
        return component;
      };

      const createComponents = (component: any) => {
        return React.createElement(component.type === 'text'
          ? React.Fragment : component.tagName, component.type === 'text' ? {} : {
            className: (component.properties && component.properties.className || []).join(' ')
          }, component.children
          ? component.children.map(createComponents)
          : (component.value || null));
      };

      let y = 80;
      const diff = 18;
      const elem: JSX.Element[] = content.split('\n').slice(0, 5)
          .map((line: string, index: number) => {
            const e: JSX.Element = (
          <>
            <g fill='#a4abb3' fill-opacity='1' stroke='#a4abb3' stroke-opacity='1' stroke-width='1' stroke-linecap='square' stroke-linejoin='bevel' transform='matrix(1,0,0,1,0,0)'>
              <text fill='#a4abb3' fill-opacity='1' stroke='none' {...{ 'xml:space': 'preserve' }} x='35' y={y} font-family='SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace' font-size='11' font-style='normal' mask='url(#codeMask)'>{index + 1}</text>
            </g>
            <g fill='#24292e' fill-opacity='1' stroke='#24292e' stroke-opacity='1' stroke-width='1' stroke-linecap='square' stroke-linejoin='bevel' transform='matrix(1,0,0,1,0,0)'>
              <text fill='#24292e' fill-opacity='1' stroke='none' {...{ 'xml:space': 'preserve' }} x='50' y={y} font-family='SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace' font-size='11' font-weight='400' font-style='normal' mask='url(#codeMask)'>
                {(() => {
                  const type = getTypeFromMime(mimeType);
                  return !refractor.listLanguages().includes(type)
                    ? line
                    : refractor
                      .highlight(line, getTypeFromMime(type))
                      .map(mapComponent)
                      .map(createComponents);
                })()
                }
              </text>
            </g>
          </>
        );
            y += diff;
            return e;
          });
      return [elem, y - diff] as const;
    })();

    lastCodeY = lastY;
    height = lastY + 28;
    codeElems = codes;
  }

  const filenameMaxLength = 36;

  const gistIcon = (<path fill-rule='evenodd' d='M7.5 5L10 7.5 7.5 10l-.75-.75L8.5 7.5 6.75 5.75 7.5 5zm-3 0L2 7.5 4.5 10l.75-.75L3.5 7.5l1.75-1.75L4.5 5zM0 13V2c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v11c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1zm1 0h10V2H1v11z' />);

  const svg = (
    <svg xmlns='http://www.w3.org/2000/svg' {...{ 'xmlns:xlink': 'http://www.w3.org/1999/xlink' }} width={width} height={height + 1} version='1.2' overflow='auto' baseProfile='tiny'>
      <style>
        {`
          tspan.keyword {
            fill: #d73a49
          }
          tspan.function, tspan.builtin {
            fill: #6f42c1
          }
          tspan.string {
            fill: #032f63
          }
          tspan.number {
            fill: #005cc5
          }
          tspan.comment {
            fill: #6a737d
          }
        `}
      </style>
      <defs />
      <g fill='none' stroke='black' stroke-width='1' fill-rule='evenodd' stroke-linecap='square' stroke-linejoin='bevel'>
        <g fill='#ffffff' fill-opacity='1' stroke='none' transform='matrix(1,0,0,1,0,0)'>
          <rect x='0' y='0' width='440' height={height + 1} />
        </g>
        {/* Boarder */}
        <rect x='0' y='0' width='441' height={height} stroke='#eaecef' stroke-width='2' />

        <g fill='#586069' fill-opacity='1' stroke='none' transform='matrix(1.25,0,0,1.25,30,21)'>
          {gistIcon}
        </g>
        <g fill='#0366d6' fill-opacity='1' stroke='#0366d6' stroke-opacity='1' stroke-width='1' stroke-linecap='square' stroke-linejoin='bevel' transform='matrix(1,0,0,1,0,0)'>
          {/* Gist name */}
          <a target={linkTarget} href={getGitHubGistUrl(gistId)}>
            <text fill='#0366d6' fill-opacity='1' stroke='none' {...{ 'xml:space': 'preserve' }} x='54' y='36' font-family='sans-serif' font-size='16' font-weight='630' font-style='normal'>{ellipsisByWidth(filename, filenameMaxLength)}</text>
          </a>
        </g>
        {(() => {
          if (isImage) {
            return (<g fill='#f6f8fa' fill-opacity='1' stroke='none' transform='matrix(1,0,0,1,30,21)'>
              <image {...{ 'xlink:href': content }} width={imgWidth} height={imgHeight} x='0' y='40' />
            </g>);
          } else {
            return [
              <mask id='codeMask'>
                <rect width={width - 17 * 2} height={height - 60 - 17} x='17' y='60' fill='white' />
              </mask>,
              <g fill='#f6f8fa' fill-opacity='1' stroke='none' transform='matrix(1,0,0,1,0,0)'>
                <rect width={width - 17 * 2} height={height - 60 - 17} x='17' y='60' />
              </g>,
              codeElems
            ];
          }
        })()}
      </g>
    </svg>
  );
  return {
    width,
    height,
    svg
  };
}
