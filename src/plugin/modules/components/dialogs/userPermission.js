define([
    'knockout'
], function (
    ko
) {
    'use strict';
    const permissions = [
        {
            value: 'n',
            icon: 'ban',
            label: 'No Permission'
        },
        {
            value: 'r',
            icon: 'eye',
            label: 'Read Only'
        },
        {
            value: 'w',
            icon: 'pencil',
            label: 'Read and Write'
        },
        {
            value: 'a',
            icon: 'share',
            label: 'Read, Write and Share'
        }
    ];

    const permissionsMap = permissions.reduce((permissionsMap, permission) => {
        permissionsMap[permission.value] = permission;
        return permissionsMap;
    }, {});

    class UserPermission {
        constructor(permission) {
            this.permission = permission;
            this.label = ko.pureComputed(() => {
                // console.log('label???', this.permission());
                return permissionsMap[this.permission()].label;
            });
            this.icon = ko.pureComputed(() => {
                // console.log('icon???', this.permission());
                return permissionsMap[this.permission()].icon;
            });
        }
    }

    return {
        UserPermission,
        permissions
    };
});