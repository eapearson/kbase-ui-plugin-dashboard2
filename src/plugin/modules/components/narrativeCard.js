define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_common/html'
], function (
    ko,
    reg,
    gen,
    ViewModelBase,
    html
) {
    'use strict';

    var t = html.tag,
        a = t('a'),
        img = t('img'),
        div = t('div'),
        span = t('span'),
        button = t('button'),
        ul = t('ul'),
        li = t('li');

    class ViewModel extends ViewModelBase {
        constructor(params, context, element) {
            super(params);
            // weird hack to get the second from top VM.
            let $parents = context['$parents'];
            let $root = $parents[$parents.length - 2];
            this.$root = $root;
            // console.log('ROOT', $root);
            this.narrative = params.narrative;
            this.username = params.username;
            this.methodStoreImageURL = params.methodStoreImageURL;
            this.narrativeFilter = params.narrativeFilter;


            this.componentNode = element.nextSibling;
            this.containerNode = element.parentElement;

            // console.log('container', container, componentInfo);

            // this.subscribe(this.narrativeFilter, () => {
            //     this.narrative.ui.show(this.showNarrative());
            // });



            // this.visible = ko.observable(this.showNarrative());

            this.subscribe(this.narrativeFilter, () => {
                let show = this.showNarrative();
                if (show) {
                    this.show(this.isVisible());
                } else {
                    this.show(false);
                }
                this.narrative.ui.show(show);
            });

            this.show = ko.observable(false);

            this.showMenu = ko.observable(false);

            this.subscribe(params.scrolled, () => {
                this.show(this.isVisible());
            });

            // this.narrativeFilterRegex = ko.pureComputed(() => {
            //     return new RegExp(this.narrativeFilter(), 'i');
            // });

            // this.subscribe(this.narrativeFilterRegex, (newValue) => {
            //     console.log('narrative filter changed: ', newValue);
            // });

            // this.doShareNarrative = $root.doShareNarrative;
            // this.doOpenNarrative = $root.doOpenNarrative;
            // this.doDeleteNarrative = $root.doDeleteNarrative;

            let obs = new MutationObserver((mutationRecord, inst) => {
                // console.log('mut', mutationRecord);
                this.show(this.isVisible());
            });
            obs.observe(this.componentNode, {attributes: true});

        }

        doOverHeader() {
            this.showMenu(true);
        }

        doOutHeader() {
            this.showMenu(false);
        }

        isVisible() {
            let cl = this.containerNode.offsetLeft;
            let cs = this.containerNode.scrollLeft;
            let cw = this.containerNode.clientWidth;
            let l = this.componentNode.offsetLeft;
            let w = this.componentNode.offsetWidth;

            let relativeLeft = (l - cl) - cs;
            let relativeRight = relativeLeft + w;
            if (relativeRight < 0) {
                return false;
            }
            if (relativeLeft > cw) {
                return false;
            }
            // console.log('visible', relativeRight, relativeLeft);
            return true;
            // if (l < 1000) {
            //     console.log(w, p, s, l);
            // }
            // return false;
            // let rect = this.componentNode.getBoundingClientRect();

            // return ( (rect.left < this.containerNode.clientWidth) &&
            //          (rect.right > 0) );

            // console.log('rect', rect);
        }

        showNarrative() {
            let matcher = this.narrativeFilter().regex;
            if (matcher === null) {
                return true;
            }
            if (matcher.test(this.narrative.title)) {
                return true;
            }
            if (matcher.test(this.narrative.owner)) {
                return true;
            }
            if (matcher.test(this.narrative.savedBy)) {
                return true;
            }
            if (this.narrative.apps.some((app) => {
                if (matcher.test(app.name)) {
                    return true;
                }
            })) {
                return true;
            }
            return false;
        }

        plural (singular, plural, count) {
            if (count === 1) {
                return singular;
            }
            return plural;
        }

        doShareNarrative(data) {
            this.$root.doShareNarrative.call(this.$root, data);
        }
        doOpenNarrative(data) {
            this.$root.doOpenNarrative.call(this.$root, data);
        }
        doDeleteNarrative(data) {
            this.$root.doDeleteNarrative.call(this.$root, data);
        }
        // koDescendantsComplete() {
        //     this.show(this.isVisible());
        // }
    }

    function buildAppIcon() {
        // This is just for the icon!
        return span({
            style: {
                fontSize: '80%',
            }
        }, span({
            class: 'fa-stack',
            style: {
                textAlign: 'center'
            }
        },  gen.if('iconUrl',
            //then
            img({
                dataBind: {
                    attr: {
                        src: '$component.methodStoreImageURL + iconUrl'
                    }
                },
                style: {
                    width: '20px',
                    height: '20px'
                }
            }),
            // else
            [
                span({
                    class: 'fa fa-square fa-stack-2x',
                    style: {
                        color: 'rgb(103, 58, 103)'
                    }
                }),
                span({
                    class: 'fa fa-inverse fa-stack-1x fa-cube'
                })
            ])));
    }

    function buildAppLabel() {
        return gen.ifnot('state',
            span({style: {fontSize: '70%'}}, html.loading()),
            gen.switch('state', [
                [
                    '"error"',
                    span({
                        dataToggle: 'tooltip',
                        dataPlacement: 'auto top',
                        dataContainer: '.your-narrative-slider',
                        dataBind: {
                            attr: {
                                title: 'title',
                            },
                            text: 'name'
                        }
                    })
                ],
                [
                    '"warning"',
                    a({
                        dataBind: {
                            attr: {
                                href: '"#appcatalog/app/" + id.shortRef'
                            }
                        }
                    }, span({
                        dataToggle: 'tooltip',
                        dataPlacement: 'auto top',
                        dataContainer: '.your-narrative-slider',
                        dataBind: {
                            attr: {
                                title: 'title',
                            },
                            text: 'name'
                        }
                    }))
                ],
                [
                    '"ok"',
                    span([
                        a({
                            dataBind: {
                                attr: {
                                    href: '"#appcatalog/app/" + id.shortRef'
                                },
                                text: 'name'
                            },
                            target: '_blank'
                        })
                        // gen.if('count > 1 && id.gitCommitHash',
                        //     span([
                        //         ' (' +
                        //         span({
                        //             dataBind: {
                        //                 text: 'id.gitCommitHash.substring(0,7)'
                        //             }
                        //         }),
                        //         ')'
                        //     ]))
                    ])
                ],
                [
                    '$default',
                    a({
                        dataBind: {
                            attr: {
                                href: '"#appcatalog/app/" + id.shortRef'
                            }
                        },
                        target: '_blank'
                    }, span({
                        dataToggle: 'tooltip',
                        dataPlacement: 'auto top',
                        dataContainer: '.your-narrative-slider',
                        dataBind: {
                            attr: {
                                title: 'title',
                            },
                            text: 'name'
                        }
                    }))
                ]

            ]));
    }

    function buildApps() {
        return gen.foreach('apps',
            div({
                class: 'app'
            }, [
                buildAppIcon(),
                span({
                    dataBind: {
                        text: '$data.count ? $data.count : ""'
                    },
                    style: {
                        width: '2em',
                        margin: '0 3px',
                        color: '#AAA'
                    }
                }),
                buildAppLabel(),
            ]));
    }

    function buildMarkdown() {
        return div({
            class: 'markdown-cells'
        }, [
            span({
                style: {
                    fontSize: '80%'
                }
            }, span({
                class: 'fa-stack'
            }, [
                span({
                    class: 'fa fa-circle fa-stack-2x',
                    style: {
                        color: '#2196F3'
                    }
                }),
                span({
                    class: 'fa fa-inverse fa-stack-1x fa-paragraph'
                })
            ])),
            span({
                dataBind: {
                    text: 'cellTypes.markdown'
                },
                style: {
                    width: '2em',
                    margin: '0 3px',
                    color: '#AAA'
                }
            }),
            span([
                'markdown ',
                gen.plural('cellTypes.markdown', 'cell', 'cells')
            ])
        ]);
    }


    function buildCode() {
        return div({
            class: 'code-cells'
        }, [
            span({
                style: {
                    fontSize: '80%'
                }
            }, span({
                class: 'fa-stack'
            }, [
                span({
                    class: 'fa fa-circle fa-stack-2x',
                    style: {
                        color: '#2196F3'
                    }
                }),
                span({
                    class: 'fa fa-inverse fa-stack-1x fa-terminal'
                })
            ])),
            span({
                dataBind: {
                    text: 'cellTypes.code'
                },
                style: {
                    width: '2em',
                    margin: '0 3px',
                    color: '#AAA'
                }
            }),
            span([
                'code ',
                gen.plural('cellTypes.code', 'cell', 'cells')
            ])
        ]);
    }

    function buildSaved() {
        return div({
            class: 'date',
            style: {
                fontStyle: 'italic'
            }
        }, [
            'saved ',
            span({
                dataBind: {
                    typedText: {
                        value: 'savedAt',
                        type: '"date"',
                        format: '"elapsed"'
                    }
                }
            }),
            ' by ',
            gen.if('savedBy === $component.username',
                //then
                'you',
                //else
                a({
                    dataBind: {
                        attr: {
                            href: '"#people/" + savedBy'
                        },
                        text: 'savedBy'
                    }
                }))
        ]);
    }

    function buildFooter() {
        return div({
            style: {
                display: 'inline-block',
                width: '100%',
                textAlign: 'center'
            }
        }, [
            // read-permission (r) or global-read-permission (n)? Can't know who else it is shared with
            gen.if('userPermission === "r" || userPermission === "n"',
                //then
                span({
                    class: 'fa fa-minus dimmed',
                    style: {
                        opacity: '0.4'
                    },
                    dataToggle: 'tooltip',
                    dataPlacement: 'auto',
                    title: 'Sharing information not available for this Narrative',
                    dataContainer: 'body'
                }),
                // else
                gen.if('permissions().length === 0',
                    //then
                    span({
                        dataToggle: 'tooltip',
                        dataPlacement: 'auto',
                        title: 'This narrative has not been shared with anyone.',
                        dataContainer: 'body',
                        dataBind: {
                            click: 'ui.canShare ? function (d) {$component.doShareNarrative(d);} : null',
                            css: {
                                'kb-btnish': 'ui.canShare ? true : false'
                            }
                        }
                    }, [
                        '0 ',
                        span({
                            class: 'fa fa-share-alt'
                        })
                    ]),
                    // else
                    span({
                        dataToggle: 'tooltip',
                        dataPlacement: 'auto',
                        dataBind: {
                            attr: {
                                title: '"This narrative has been shared with " + permissions.length + " " + $component.plural("user", "users", permissions.length)'
                            },
                            click: 'ui.canShare ?  function (d) {$component.doShareNarrative(d);} : null',
                            css: {
                                'kb-btnish': 'ui.canShare ? true : false'
                            }
                        }
                    }, [
                        span({
                            dataBind: {
                                text: 'permissions().length'
                            }
                        }),
                        ' ',
                        span({
                            class: 'fa fa-share-alt'
                        })
                    ]))),
            gen.if('isPublic()',
                // then
                span({
                    class: 'fa fa-globe',
                    dataToggle: 'tooltip',
                    dataPlacement: 'auto',
                    title: 'This narrative is Publicly available',
                    dataContainer: 'body',
                    style: {
                        marginLeft: '10px'
                    },
                    dataBind: {
                        click: 'ui.canShare ?  function (d) {$component.doShareNarrative(d);} : null',
                        css: {
                            'kb-btnish': 'ui.canShare ? true : false'
                        }
                    }
                }))
        ]);
    }


    function buildCardMenu() {
        return div({
            class: 'btn-group',
            // dataBind: {
            //     visible: '$component.showMenu()'
            // }
        }, [
            button({
                type: 'button',
                class: 'btn btn-default btn-sm dropdown-toggle btn-kb-toggle-dropdown',
                style: {
                    margin: '0',
                    padding: '4px 8px'
                },
                dataToggle: 'dropdown',
                ariaHasPopup: 'true',
                areaExpanded: 'false'
            }, [
                span({
                    class: 'fa fa-ellipsis-h'
                })
            ]),
            ul({
                class: 'dropdown-menu dropdown-menu-right',
                style: {
                    zIndex: '100'
                }
            }, [
                li(div({
                    style: {
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: 'gray'
                    }
                }, 'Narrative')),
                // '<!-- ko if: matchClass.copyable -->',
                gen.if('ui.canEdit',
                    li(a({
                        dataBind: {
                            click: 'function (d) {$component.doOpenNarrative(d);}'
                        },
                        title: 'You have write access to this Narrative; you may open and edit it'
                    }, [
                        span({
                            class: 'fa fa-pencil',
                            style: {
                                marginRight: '4px',
                                color: 'green'
                            }
                        }),
                        'Open for Edit'
                    ])),
                    li(a({
                        dataBind: {
                            click: 'function (d) {$component.doOpenNarrative(d);}'
                        },
                        title: 'You have view only access to this Narrative; you may open it in view-only mode'
                    }, [
                        span({
                            class: 'fa fa-eye',
                            style: {
                                marginRight: '4px'
                            }
                        }),
                        'Open for View'
                    ]))),
                gen.if('ui.canShare',
                    li(a({
                        dataBind: {
                            // click: '$component.doShareNarrative'
                            click: 'function (d) {$component.doShareNarrative(d);}'
                        },
                        title: 'You have admin access to this Narrative; you may share it with other users'
                    }, [
                        span({
                            class: 'fa fa-share',
                            style: {
                                marginRight: '4px',
                                color: 'blue'
                            }
                        }),
                        'Share'
                    ]))),
                gen.if('ui.canDelete',
                    li(a({
                        dataBind: {
                            click: 'function (d, e) {$component.doDeleteNarrative(d,e);}'
                            // click: '$component.doDeleteNarrative'
                        },
                        title: 'You own this Narrative; you may delete it'
                    }, [
                        span({
                            class: 'fa fa-trash',
                            style: {
                                marginRight: '4px',
                                color: 'red'
                            }
                        }),
                        'Delete'
                    ]))),
                // '<!-- /ko -->',
                // '<!-- ko if: matchClass.viewable -->',
                // li(a({
                //     // dataBind: {
                //     //     click: '$component.doViewObject'
                //     // }
                // }, 'View')),
                // '<!-- /ko -->'
            ])
        ]);
    }

    function buildPlaceholderCardMenu() {
        return div({
            class: 'btn-group'
        }, [
            button({
                type: 'button',
                class: 'btn btn-default btn-sm dropdown-toggle btn-kb-toggle-dropdown',
                style: {
                    margin: '0',
                    padding: '4px 8px',
                    color: 'rgba(150,150,150,0.8)'
                },
                dataToggle: 'dropdown',
                ariaHasPopup: 'true',
                areaExpanded: 'false'
            }, [
                span({
                    class: 'fa fa-ellipsis-h'
                })
            ])
        ]);
    }

    function buildCard() {
        return div({
            class: '-card',
            dataBind: {
                visible: 'narrative.ui.show()',
                with: 'narrative'
            }
        }, [
            div({
                class: '-inner -box',
                dataBind: {
                    if: '$component.show'
                }
            }, [
                div({
                    class: '-header',
                    dataBind: {
                        event: {
                            mouseenter: 'function() {$component.doOverHeader.call($component);}',
                            mouseleave: 'function () {$component.doOutHeader.call($component);}'
                        }
                    }
                }, [
                    div({
                        class: '-title'
                    }, a({
                        dataBind: {
                            attr: {
                                href: '"/narrative/" + narrativeId',
                                title: 'title'
                            },
                            text: 'title'
                        },
                        target: '_blank'
                    })),
                    div({
                        class: '-menu'
                    }, gen.if('$component.showMenu()',
                        buildCardMenu(),
                        buildPlaceholderCardMenu()))
                ]),
                div({
                    class: '-body',
                    dataBind: {
                        event: {
                            mouseover: function(data) {
                                data.ui.active(true);
                            },
                            mouseout: function(data) {
                                data.ui.active(false);
                            }
                        },
                        css: {
                            '-active': '$data.ui.active() ? true : false',
                            '-autoOverflow': '$data.ui.active() ? true : false'
                        }
                    }
                }, [
                    div({
                        class: 'appsMethods'
                    }, buildApps()),
                    gen.if('cellTypes.markdown', buildMarkdown()),
                    gen.if('cellTypes.code', buildCode()),
                ]),
                div({
                    class: '-footer'
                }, buildFooter()),
                div({
                    class: '-saved'
                }, buildSaved())
            ])
        ]);
    }

    function template() {
        return buildCard();
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});