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

        pilihan.forEach((x) => {
            for (const item in penyakit_diagnose)
                if (!penyakit_diagnose[item].includes(+x))
                    delete penyakit_diagnose[item];
        });
    }
    else if (!cond && pilihan.size == 1) {
        pilihan.delete(key);
        penyakit_diagnose = structuredClone(penyakit);
    }
    else {
        pilihan.delete(key);
        list_pilihan = Array.from(pilihan);

        pilihan.forEach((x) => {
            for (const item in penyakit)
                if (!penyakit_diagnose.hasOwnProperty(item) && check_contains(penyakit[item], list_pilihan))
                    penyakit_diagnose[item] = penyakit[item];
        });
    }

    if (pilihan.size > 0)
        display_diagnose(penyakit_diagnose, pilihan);
    else
        tbody.innerHTML = '';
}

function check_contains(list_penyakit, list_gejala) {
    for (let i = 0; i < list_gejala.length; i++)
        if (!list_penyakit.includes(+list_gejala[i]))
            return false;
            
    return true;
}

function display_diagnose(list_penyakit, list_gejala) {
    tbody.innerHTML = '';
    result.innerHTML = '';
    let matches = [];

    if (Object.keys(penyakit).length == 0)
        return;

    Object.keys(list_penyakit).forEach((x) =>
        tbody.innerHTML += `<tr><td>${x}</td><td>${list_penyakit[x].join(', ')}</td><td class='center'>${compare(list_penyakit, x, list_gejala, matches).toFixed(2)}</td></tr>`
    );

    let title = matches.length > 0 ? 'Terdapat Match 100% dari Gejala yang Anda Alami:<br>' : 'Belum Menemukan Match 100% dari Gejala yang Diberikan';

    result.innerHTML = `<h4>${title}</h4>` + matches.map((x, i) => `${i + 1}. ${x}`).join('<br/>');
}

function compare(list_penyakit, penyakit, list_gejala, matches) {
    count = 0;

    list_gejala.forEach((x) => {
        count += list_penyakit[penyakit].includes(+x);
    });

    let res = (count / list_penyakit[penyakit].length) * 100;

    if (res == 100)
        matches.push(penyakit);

    return res;
}