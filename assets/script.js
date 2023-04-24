const gejala = json_data['Gejala'];
const penyakit = json_data['Penyakit'];
const max_symp = json_data['max_symptoms'];

const tbody = document.getElementById('list-analysed').getElementsByTagName('tbody')[0];
const selection_gejala = document.getElementById('gejala');
const result = document.getElementById('result');

const pilihan = new Set();
let penyakit_diagnose = structuredClone(penyakit);

Object.keys(gejala).forEach((x) =>
    selection_gejala.add(new Option(gejala[x], x))
);

$(document).ready(function () {
    $('#gejala').select2({
        placeholder: 'Gejala yang Dialami',
        maximumSelectionLength: max_symp.length,
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
        if (/[^a-zA-Z ]/.test(e.key))
            e.preventDefault();
    };
});

function diagnose_symptoms(key, cond) {

    if (cond && /^\d+/.test(key)) {
        pilihan.add(key);
    }
    else if (!cond && pilihan.size == 1) {
        pilihan.delete(key);
        penyakit_diagnose = structuredClone(penyakit);
    }
    else {
        pilihan.delete(key);
    }

    if (pilihan.size > 0)
        display_diagnose(penyakit_diagnose, pilihan);
    else
        tbody.innerHTML = result.innerHTML = '';
}

function display_diagnose(list_penyakit, list_gejala) {
    tbody.innerHTML = '';
    result.innerHTML = '';
    let max_prob = [0, ''];

    for (const item in list_penyakit) {
        compare(list_penyakit, item, list_gejala, max_prob);
    }

    const sorted = Object.entries(list_penyakit).sort((x, y) => y[1]['prob'] - x[1]['prob']).filter((z) => +z[1]['prob'] > 0);

    sorted.forEach((x) => {
        tbody.innerHTML += `<tr><td class="center">${x[0]}</td><td>${x[1]['gejala'].map((z) => gejala[z]).join(', ')}</td><td class='center'>${x[1]['prob']}</td></tr>`;
    });

    let matches = '<table><tr><td>' + sorted.filter((x) => x[1]['prob'] - max_prob[0] >= 0).map((x, i) => `${i + 1}. ${x[0]} (${x[1]['prob']} %)`).join('</td></tr><tr><td>') + '</td></tr></table>';

    if (max_prob[0] == 100)
        result.innerHTML = `<br><h4>Terdapat Match 100% dari Gejala yang Anda Alami:</h4>` + matches;
    else
        result.innerHTML = `<br><h4>Belum Menemukan Match 100% dari Gejala yang Diberikan, Namun Berikut Diagnosa dengan Kemungkinan Tertinggi:</h4>` + matches;
}

function compare(list_penyakit, penyakit, list_gejala, prob) {
    count = 0;

    list_gejala.forEach((x) => {
        count += list_penyakit[penyakit]['gejala'].includes(+x);
    });

    let res = ((count / list_penyakit[penyakit]['gejala'].length) * 100).toFixed(2);

    list_penyakit[penyakit]['prob'] = res;

    if (res - prob[0] > 0) {
        prob[0] = res;
        prob[1] = penyakit;
    }
}