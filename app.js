

const $input = $("input[name='Search']");
const $userform = $("#user-form");
console.log("Running...");
const noticePlaceholder = document.getElementById('liveNoticePlaceholder')

const notice = (message, type) => {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('')

    noticePlaceholder.append(wrapper)
}


$(function () {
    $.jstree.defaults.core.data = true;
    $.jstree.defaults.core.check_callback = true;


    $('button').on('click', function () {
        $('#jstree_demo_div').jstree(true).select_node('child_node_1');
        $('#jstree_demo_div').jstree('select_node', 'child_node_1');
        $.jstree.reference('#jstree_demo_div').select_node('child_node_1');
    });

    $('form').on('submit', function (event) {
        event.preventDefault();
        let nodes = [];
        const userInput = $input.val();
        const searchTerm = encodeURIComponent(`${userInput}`);

        if (isValidUrl(userInput)) { //USER INPUT VALIDATION
            notice("Searching!", "success");
            $.get(`127.0.0.1:5049/query/${searchTerm}`, (data) => { //RESTAPI QUERY (SEARCH DB FIRST, SCRAPE IF NEEDED)
                return data;
            }).then(data => { //
                let paths = data;
                let result = [];
                let level = { result };

                //HIERARCHY/TREE BUILDER------
                for (var i = 0; i < data.length; i++) {
                    const url = data[i]['url'];
                    url.split('/').reduce((r, name, i, a) => {
                        if (!r[name]) {
                            r[name] = { result: [] };
                            r.result.push({ text: name, children: r[name].result })
                        }

                        return r[name];
                    }, level)
                }

                console.log(result)
                nodes = result;

                //MANIPULATE DOM AND DISPLAY
                let $container = $('#results_container').empty();
                let $jstree_demo_div = $(`<div id="jstree_demo_div"></div>`);
                $jstree_demo_div.html(`<div id="jstree_demo_div"><ul></ul></div>`);
                $jstree_demo_div.appendTo($container);

                $('#jstree_demo_div').jstree({
                    'core': {
                        'data': nodes
                    }
                });

                return data;

            });
        } else {
            notice('Please enter a valid url e.g. https://cnn.com', 'danger')
            //alert('Please enter a valid url e.g. https://cnn.com');
        };
        console.log(nodes);



    });

});



//URL VALIDATION CHECK
const isValidUrl = urlString => {
    var a = document.createElement('a');
    a.href = urlString;
    return (a.host && a.host != window.location.host);
}






