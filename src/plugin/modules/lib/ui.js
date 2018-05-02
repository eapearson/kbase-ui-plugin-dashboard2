define([
    'kb_common/html'
], function (
    html
) {
    'use strict';

    let t = html.tag,
        button = t('button'),
        span = t('span'),
        div = t('div');

    function buildDialog(arg) {
        let type = arg.type || 'default';
        let titleColor;
        let iconClass;
        switch (type) {
        case 'warning':
            iconClass = arg.icon || 'exclamation-triangle';
            titleColor = '#8a6d3b';
            break;
        case 'danger':
        case 'error':
            iconClass = arg.icon || 'frown-o';
            titleColor = '#a94442';
            break;
        case 'succcess':
            iconClass = arg.icon || 'thumbs-up-o';
            titleColor = '##3c763d;';
            break;
        case 'info':
            iconClass = arg.icon || 'info';
            titleColor = '#2e618d';
            break;
        case 'primary':
            iconClass = arg.icon || null;
            titleColor = '#2e618d';
            break;
        case 'default':
        default:
            iconClass = arg.icon || null;
            titleColor = '#000';
        }

        let icon;
        if (iconClass) {
            icon = span({
                class: 'fa fa-' + iconClass,
                style: {
                    marginRight: '4px',
                    fontWeight: 'bold',
                    fontSize: '120%'
                }
            });
        } else if (arg.icon) {
            icon = span({
                class: 'fa fa-' + arg.icon,
                style: {
                    marginRight: '4px',
                    fontWeight: 'bold',
                    fontSize: '120%'
                }
            });
        } else {
            icon = '';
        }

        let buttons = arg.buttons || [{
            label: 'Close',
            onClick: 'onClose'
        }];

        let buttonsContent = buttons.map(function (btn) {
            let buttonBindings = {
                click: btn.onClick
            };
            if (btn.enable) {
                buttonBindings.enable = btn.enable;
            }
            if (btn.disable) {
                buttonBindings.disable = btn.disable;
            }
            return button({
                type: 'button',
                class: 'btn btn-' + (btn.type || 'default'),
                dataBind: buttonBindings
            }, btn.label);
        }).join(' ');


        return div({
        }, [
            // title
            div({
                style: {
                    color: titleColor,
                    backgroundColor: 'rgba(255,255,255,1)',
                    fontSize: '130%',
                    fontWeight: 'bold',
                    padding: '15px',
                    borderBottom: '1px solid #e5e5e5'
                }
            }, [
                icon,
                arg.title
            ]),
            // body
            div({
                style: {
                    padding: '15px',
                    minHeight: '10em',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    backgroundColor: 'rgba(255,255,255,1)',
                }
            }, arg.body),
            // buttons
            div({
                class: 'clearfix',
                style: {
                    padding: '15px',
                    textAlign: 'right',
                    backgroundColor: 'rgba(255,255,255,1)',
                    borderTop: '1px solid #e5e5e5'
                }
            }, div({
                class: 'btn-toolbar pull-right',
                style: {
                    textAlign: 'right',
                }
            }, buttonsContent))
        ]);
    }

    function bootstrapTextColor(type) {
        type = type || 'default';
        let color;
        switch (type) {
        case 'warning':
            color = '#8a6d3b';
            break;
        case 'danger':
        case 'error':
            color = '#a94442';
            break;
        case 'succcess':
            color = '##3c763d;';
            break;
        case 'primary':
            color = '#2e618d';
            break;
        case 'muted':
            color = '#777';
            break;
        case 'default':
        default:
            color = '#000';
        }
        return color;
    }

    function buildFullHeightDialog(arg) {
        let type = arg.type || 'default';
        let titleColor;
        let iconClass;
        switch (type) {
        case 'warning':
            iconClass = arg.icon || 'exclamation-triangle';
            titleColor = '#8a6d3b';
            break;
        case 'danger':
        case 'error':
            iconClass = arg.icon || 'frown-o';
            titleColor = '#a94442';
            break;
        case 'succcess':
            iconClass = arg.icon || 'thumbs-up-o';
            titleColor = '##3c763d;';
            break;
        case 'info':
            iconClass = arg.icon || 'info';
            titleColor = '#2e618d';
            break;
        case 'primary':
            iconClass = arg.icon || null;
            titleColor = '#2e618d';
            break;
        case 'default':
        default:
            titleColor = '#000';
        }

        let icon;
        if (iconClass) {
            icon = span({
                class: 'fa fa-' + iconClass,
                style: {
                    marginRight: '4px'
                }
            });
        } else {
            icon = '';
        }

        let buttons = arg.buttons || [{
            label: 'Close',
            onClick: 'onClose'
        }];

        let buttonsContent = buttons.map(function (btn) {
            return button({
                type: 'button',
                class: 'btn btn-' + (btn.type || 'default'),
                dataBind: {
                    click: btn.onClick
                }
            }, btn.label);
        }).join(' ');

        return div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        }, [
            // title
            div({
                style: {
                    color: titleColor,
                    backgroundColor: 'rgba(255,255,255,1)',
                    fontSize: '130%',
                    fontWeight: 'bold',
                    padding: '15px',
                    borderBottom: '1px solid #e5e5e5'
                }
            }, [
                icon,
                arg.title
            ]),
            // body
            div({
                style: {
                    padding: '15px',
                    minHeight: '10em',
                    // maxHeight: 'calc(100vh - 100px)',
                    backgroundColor: 'rgba(255,255,255,1)',
                    overflowY: 'auto',
                    flex: '1 1 0px',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }, arg.body),
            // buttons
            div({
                class: 'clearfix',
                style: {
                    padding: '15px',
                    textAlign: 'right',
                    backgroundColor: 'rgba(255,255,255,1)',
                    borderTop: '1px solid #e5e5e5'
                }
            }, div({
                class: 'btn-toolbar pull-right',
                style: {
                    textAlign: 'right',
                }
            }, buttonsContent))
        ]);
    }

    function  buildNA() {
        return span({
            style: {
                fontStyle: 'italic',
                color: '#AAA'
            }
        }, 'n/a');
    }

    return {
        buildDialog,
        buildFullHeightDialog,
        bootstrapTextColor,
        buildNA
    };
});