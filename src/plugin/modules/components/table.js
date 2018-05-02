define([
    'kb_knockout/registry',
    'kb_knockout/lib/viewModelBase',
    'kb_knockout/lib/generators',
    'kb_common/html'
], function (
    reg,
    ViewModelBase,
    gen,
    html
) {
    'use strict';

    let t = html.tag,
        div = t('div'),
        span = t('span');

    class ViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            this.rows = params.rows;
            this.table = params.table;

        }

        doSort(data) {
            let currentSortColumn = this.table.sort.column();
            let currentSortDirection = this.table.sort.direction();
            if (currentSortColumn === data.name) {
                if (currentSortDirection === 'asc') {
                    this.table.sort.direction('desc');
                } else {
                    this.table.sort.direction('asc');
                }
            } else {
                this.table.sort.column(data.name);
                this.table.sort.direction(currentSortDirection);
            }
        }
    }

    function buildTable() {
        // let bodyStyle = {};
        // let headerStyle = {};
        // let uberStyle = {};
        // if (def.style.maxHeight) {
        //     bodyStyle.maxHeight = def.style.maxHeight;
        //     bodyStyle.overflowY = 'scroll';
        //     headerStyle.overflowY = 'scroll';
        // }
        // if (def.style.backgroundColor) {
        //     uberStyle.backgroundColor = def.style.backgroundColor;
        // }

        let header = div({
            dataBind: {
                style: {
                    'overflow-y': 'table.style.maxHeight ? "scroll" : null'
                }
            },
            style: {
                '-moz-user-select': 'none',
                '-webkit-user-select': 'none',
                '-ms-user-select': 'none',
                userSelect: 'none'
            }
        }, gen.foreach('table.columns',
            div({
                style: {
                    display: 'inline-block',
                    fontStyle: 'italic',
                    padding: '4px',
                    cursor: 'pointer',
                    userSelect: 'none'
                },
                dataBind: {
                    style:  {
                        width: 'width + "%"'
                    },
                    click: 'function (d, e) {$component.doSort.call($component,d,e);}'
                }
            }, [
                span({
                    dataBind: {
                        text: 'label'
                    }
                }),
                span({
                    dataBind: {
                        visible: 'sort',
                        css: {
                            'fa-sort-desc': '$component.table.sort.column() === name && $component.table.sort.direction() === "desc"',
                            'fa-sort-asc': '$component.table.sort.column() === name && $component.table.sort.direction() === "asc"',
                            'fa-sort': '$component.table.sort.column() !== name'
                        },
                        style: {
                            color: '$component.table.sort.column() !== name ? "#AAA" : "#000"'
                        }
                    },
                    style: {
                        marginLeft: '4px'
                    },
                    class: 'fa'
                })
            ])
        ));
        // we loop across all the columns; remember, this is invoked
        // within the row, so we need to reach back up to get the
        // row context.
        let row = div({
            dataBind: {
                with: 'row'
            }
        }, gen.foreachAs('$component.table.columns', 'column',
            // make the implicit context the row again.
            gen.if('column.component',
                // use the column specified for the column, using the
                // specified params (relative to row) as input.
                div({
                    style: {
                        display: 'inline-block',
                        padding: '4px'
                    },
                    dataBind: {
                        style:  {
                            width: 'column.width + "%"'
                        }
                    }
                }, span({
                    dataBind: {
                        component: {
                            name: 'column.component.name',
                            // hopefully params are relative to the row context...
                            params: 'eval("(" + column.component.params + ")")'
                            // params: {
                            //     username: 'username',
                            //     realname: 'realname'
                            // }
                        },
                        // text: 'column.component.name'
                    }
                })),
                // else use the row's column value directly
                div({
                    style: {
                        display: 'inline-block',
                        padding: '4px'
                    },
                    dataBind: {
                        style:  {
                            width: 'column.width + "%"'
                        }
                    }
                }, span({
                    dataBind: {
                        text: 'row[column.name]'
                    }
                })))));


        return div({
            dataBind: {
                style: {
                    'background-color': 'table.style.backgroundColor'
                }
            }
        }, [
            header,
            div({
                dataBind: {
                    style: {
                        maxHeight: 'table.style.maxHeight || null',
                        overflowY: 'table.style.maxHeight ? "scroll" : null'
                    }
                }
            }, gen.foreachAs('rows', 'row', row))
        ]);
    }

    function template() {
        return buildTable();
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});