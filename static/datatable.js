const HTML_CHEVRON_DOWN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="35.912" height="20.077" viewBox="0 0 35.912 20.077"><defs><style>.a{fill:none;stroke:#333;stroke-width:3px;}</style></defs><path class="a" d="M36.107,2581,53,2597.9l-16.9,16.9" transform="translate(2615.851 -35.046) rotate(90)"/></svg>'
const HTML_CHEVRON_RIGHT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="35.912" height="20.077" viewBox="0 0 35.912 20.077" style="transform:rotate(270deg);"><defs><style>.a{fill:none;stroke:#333;stroke-width:3px;}</style></defs><path class="a" d="M36.107,2581,53,2597.9l-16.9,16.9" transform="translate(2615.851 -35.046) rotate(90)"/></svg>'

function furtherInfo(doc) {
  const abstract = doc.abstract
    ? `
                <div class="furtherInfoText">${doc.abstract
                  .split('\n')
                  .map(function(par) {
                    return '<p>' + par + '</p>'
                  })
                  .join('\n')}</div>
            `
    : ''

  const website = doc.websites
    ? `<a target="_blank" rel="noopener noreferrer" href="${
        doc.websites[0]
      }">Show on Publisher Website</a>`
    : ''
  const download = doc.file_attached
    ? `<a target="_blank" rel="noopener noreferrer" href="/download/${doc.id}">Download full text</a>`
    : '<span>Fulltext available from Publisher</span>'

  return `
                <div class="furtherInfo">
                    <div class="furtherInfoContent">
                        ${abstract}
                    </div>
                    <div class="furtherInfoAction">
                        ${website}
                        ${download}
                    </div>
                </div>
            `
}

class Datatable {
  getChevronToggleHTMLString(id) {
    const $div = $(
      `<div onClick="App.Datatable.toggle('${id}')" class='entry__chevron-wrapper'>&nbsp;</div>`
    )
    $div.append(HTML_CHEVRON_RIGHT)
    return $div[0].outerHTML
  }

  toggle(id) {
    const isVisible = $(`div.entry[data-id="${id}"] .entry__abstract`).is(
      ':visible'
    )
    if (isVisible) {
      $(`div.entry[data-id="${id}"]`)
        .closest('tr')
        .find('.entry__chevron-wrapper svg')
        .css({
          transform: 'rotate(0deg)',
        })
    } else {
      $(`div.entry[data-id="${id}"]`)
        .closest('tr')
        .find('.entry__chevron-wrapper svg')
        .css({
          transform: 'rotate(-90deg)',
        })
    }
    $(`div.entry[data-id="${id}"] .entry__abstract`).slideToggle()
  }

  init(data) {
    const $table = $('.data-table')
    this.data = data

    bootstrapMenu(data)

    const dataTable = $table.DataTable({
      data,
      deferRender: true,
      columns: [
        {
          data: null,
          orderable: false,
          render: (data, type, row, meta) => {
            return this.getChevronToggleHTMLString(row.id)
          },
          width: '100px',
        },
        {
          data: 'content',
          render: (item, type, row) =>
            Handlebars.compile(
              document.getElementById('template-entry').innerHTML
            )(row),
        },
        { data: 'year', defaultContent: '', visible: false },
      ],
      pageLength: 20,
      dom: 't p i',
      ordering: true,
      order: [[2, 'desc']],
      orderClasses: false,
      language: {
        paginate: {
          first: '<<',
          last: '>>',
          next: '>',
          previous: '<',
        },
      },
      autoWidth: false,
    })

    $('.title-bar__input').on('change keyup', function(event) {
      dataTable
        .search(
          String(event.target.value)
            .valueOf()
            .trim()
        )
        .draw()
    })

    setTimeout(() => {
      $('.data-table tfoot').remove()
    })
  }
}
window.App.Datatable = new Datatable()

// var DataTablesLinkify = function(dataTable) {
//     this.dataTable = dataTable;
//     this.url = location.protocol+'//'+location.host+location.pathname;
//     this.link = function() {
//         return this.url +
//             '?dtsearch='+this.dataTable.search() +
//             '&dtpage='+this.dataTable.page();
//             //more params like current sorting column could be added here
//     }
//     //based on http://stackoverflow.com/a/901144/1407478
//     this.getParam = function(name) {
//         name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
//         var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
//             results = regex.exec(location.search);
//         return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
//     }
//     this.restore = function() {
//         var page = this.getParam('dtpage'),
//             search = this.getParam('dtsearch');
//         if (search) this.dataTable.search(search).draw(false);
//         if (page) this.dataTable.page(parseInt(page)).draw(false);
//         //more params to take care of could be added here
//     }
//     this.restore();
//     return this;
// };

// function syncURLWithtable() {
//   linkify = DataTablesLinkify(table)
// }
