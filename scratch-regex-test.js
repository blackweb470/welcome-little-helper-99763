const html = `
<table class="data-table">
  <tr class="header-row">
    <th width="100">Name</th>
    <th class="col">Age</th>
  </tr>
  <tr>
    <td>Alice</td>
    <td align="right">25</td>
  </tr>
</table>
`;

const tableRegex = /<table[\s\S]*?>([\s\S]*?)<\/table>/gi;
let tableMatch;

while ((tableMatch = tableRegex.exec(html)) !== null) {
  const tableHtml = tableMatch[0];
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[1];
    const cells = [];
    const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1].trim());
    }
    rows.push(cells);
  }
  console.log('Fixed Regex:', rows);
}

const tableRegexOld = /<table[\s\S]*?>([\s\S]*?)<\/table>/gi;
let tableMatchOld;

while ((tableMatchOld = tableRegexOld.exec(html)) !== null) {
  const tableHtml = tableMatchOld[0];
  const rows = [];
  const rowRegex = /<tr[\s>]([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[1];
    const cells = [];
    const cellRegex = /<(?:td|th)[\s>]([\s\S]*?)<\/(?:td|th)>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1].trim());
    }
    rows.push(cells);
  }
  console.log('Old Regex:', rows);
}
