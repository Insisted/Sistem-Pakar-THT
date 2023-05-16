const gejala = json_data['Gejala'];
const penyakit = json_data['Penyakit'];
const max_symp = json_data['max_symptoms'];

const selection_gejala = document.getElementById('gejala');
const prob_th = document.getElementById('prob_th');
const result = document.getElementById('result');
const tbody = document.getElementById('tbody');
const tr_th = document.getElementById('tr_th');
let sort_by = prob_th;

const gejala_keys = Object.keys(gejala);
const penyakit_keys = Object.keys(penyakit);
const pilihan = new Set();
let state = false;

gejala_keys.forEach((x) =>
    selection_gejala.add(new Option(gejala[x], x))
);

$(document).ready(function () {
    $('#toggle').click(function () {
        state = $(this).is(':checked');

        $('#gejala').select2({ maximumSelectionLength: state ? max_symp.length : undefined });

        if (state)
            for (let i of Array.from(pilihan).slice(10,)) {
                pilihan.delete(i);
                $(`a[value=${i}]`).click();
            }

        if (pilihan.size)
            display_diagnose(Array.from(pilihan));
    });

    $('#gejala').select2({
        placeholder: {
            id: '0',
            text: 'Gejala yang Dialami'
        },
        maximumSelectionLength: state ? max_symp.length : undefined,
        tags: true,
        language: {
            maximumSelected: function () {
                return 'Maksimum Gejala Penyakit yang Ada di Database Terbatas 10 Gejala';
            }
        }
    }).on('change', function () {
        let selected = $(this).find('option:selected');
        let container = $(this).siblings('#selection');
        let list = $('<ul>');

        selected.each(function (k, v) {
            let key = $(v).attr('value');

            let li = $(`<li class='selected-list'><a class='unselect-list' value='${key}'>×</a>` + $(v).text() + '</li>');

            li.children('a.unselect-list').off('click.select2-copy').on('click.select2-copy', function (e) {
                let $opt = $(this).data('select2-opt');

                $opt.prop('selected', false);
                $opt.parents('select').trigger('change');
            }).data('select2-opt', $(v));

            list.append(li);
        });

        container.html('').append(list);

        $('a').on('click', function (e) {
            diagnose_symptoms($(this).attr('value'), false);
        });
    }).on('select2:selecting', function (e) {
        diagnose_symptoms(e.params.args.data.id, true);
    }).on('select2:unselecting', function (e) {
        diagnose_symptoms(e.params.args.data.id, false);
    }).trigger('change');

    document.getElementsByClassName('select2-search__field')[0].onkeydown = function (e) {
        if (/\d/.test(e.key))
            e.preventDefault();
    };
});

function diagnose_symptoms(key, cond) {

    if (cond)
        pilihan.add(key);
    else
        pilihan.delete(key);

    if (pilihan.size)
        display_diagnose(Array.from(pilihan))
    else {
        loadHandlers(false);

        tbody.innerHTML = result.innerHTML = '';
    }
}

function display_diagnose(list_gejala) {
    tbody.innerHTML = '';
    result.innerHTML = '';
    let max_prob = [0, ''];

    penyakit_keys.forEach((x) =>
        compare(x, list_gejala, max_prob)
    );

    const sorted = Object.entries(penyakit).filter((z) => z[1]['prob'] > 0);

    let matches = '<table><tr><td>' +
        sorted.filter(function (x) {
            tbody.innerHTML += `<tr><td class='center'>${x[0]}</td><td>${x[1]['gejala'].map(
                (z) => gejala[z]
            ).join(', ')}</td><td class='center'>${x[1]['prob']}</td></tr>`;

            return x[1]['prob'] - max_prob[0] >= 0;
        }).map(
            (x, i) => `${i + 1}. ${x[0]} (${x[1]['prob']} %)`
        ).join('</td></tr><tr><td>') + '</td></tr></table>';

    if (!sorted.length) {
        result.innerHTML = `<br><h4>Kemungkinan Penyakit Tidak Terdapat Dalam Database</h4>`;
        loadHandlers(false)
        return;
    }
    else if (max_prob[0] == 100)
        result.innerHTML = `<br><h4>Terdapat Match 100% dari Gejala yang Anda Alami:</h4>` + matches;
    else
        result.innerHTML = `<br><h4>Belum Menemukan Match 100% dari Gejala yang Diberikan,
            Namun Berikut Diagnosa dengan Kemungkinan Tertinggi:</h4>` + matches;

    loadHandlers(true);

    prob_th.dataset.order = 1;
    sort_table('2');
}

function compare(sakit, list_gejala, prob) {
    let count = 0;

    list_gejala.forEach((x) =>
        count += penyakit[sakit]['gejala'].includes(x)
    );

    let res = ((count / penyakit[sakit]['gejala'].length) * 100).toFixed(2);

    penyakit[sakit]['prob'] = res * (state ? list_gejala.every((x) => penyakit[sakit]['gejala'].includes(x)) : true);

    if (penyakit[sakit]['prob'] - prob[0] > 0) {
        prob[0] = res;
        prob[1] = sakit;
    }
}

function sort_table(col) {
    let column = tr_th.cells[col];
    let olr_ord = +(column.dataset.order || '1');
    let new_ord = -olr_ord;
    let list = Array.from(tbody.rows);

    let span_by = sort_by.getElementsByTagName('span')[0];
    let span_col = column.getElementsByTagName('span')[0];

    column.dataset.order = new_ord;
    span_by.innerHTML = '';
    span_col.innerHTML = new_ord == 1? '▲' : '▼';

    list.sort(function (row1, row2) {
        let a = row1.cells[col].innerHTML;
        let b = row2.cells[col].innerHTML;

        if (col == 2) {
            a = +a;
            b = +b;
        }

        return a > b ? new_ord : a < b ? olr_ord : 1;
    });

    list.forEach((x) =>
        tbody.appendChild(x)
    );

    sort_by = column;
}

function addHandlers(element, col, cond) {
    element.onclick = cond ? (e) => sort_table(col) : undefined;
}

function loadHandlers(condition) {
    if(!condition)
        sort_by.getElementsByTagName('span')[0].innerHTML = '';

    addHandlers(document.getElementById('penyakit_th'), 0, condition);
    addHandlers(document.getElementById('gejala_th'), 1, condition);
    addHandlers(prob_th, 2, condition);
}