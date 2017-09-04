/**
 * 基本CRUD的帮助脚本,通过基本配置完成页面的操作
 * 此版本非单例,以前的crud是单例.
 * 1.必须配置的项:
 *  primaryKey,modelName,columns
 * 2.使用方法
     * var option = {
     *  primaryKey:'id',
     *  modelName:'sys',
     *  columns:...,
     * }
     * var _crud = CRUD.createInstance() ;
     * _crud.init(option) ;
 *
 * @type {{createInstance: CRUD.createInstance}}
 */
var CRUD = {
    createInstance: function () {
        var option = {
            //数据列表的主键
            primaryKey: "id",
            //模块名,拼接url请求地址
            modelName:'',
            //datatables格式的columns
            columns:null,

            //page type,(商户,后台)//admin,merchant
            pageType:'admin',
            //定义除了defaultInit中的哪个不执行
            exclude:[],
            url: {
                SOU: null,
                DEL: null,
                LIST: null,
                EDIT: null
            },
            id: {
                btnSave: 'btnSave',
                btnEdit: 'btnEdit',
                btnDel: 'btnDel',
                btnQuery: 'btnQuery',
                btnReset: 'btnReset',

                tb: 'tb',

                queryForm: 'queryForm',
                editForm: 'editForm',

                editModal: 'editModal'
            },
            //回调方法扩展
            callbackx:{
                add:null,//function
                edit:null,//function
                sou:null,//function
                del:null,//function
                reset:null//function
            },
            //事件方法扩展
            eventx:{
                onEditModalClosed:null,
                onEditModalShown:null,
                onPreSave:null
            },
            //事件重新绑定
            rebind:{
                edit:null,//function
                del:null//function
            },
            //回调方法重写
            callback:{
                edit:null,//function
                sou:null//function
            },
            param:{
                //post请求参数
                post:{
                    sou:null//function
                },
                //数据列表请求参数
                tb:null//function
            },
            paramAddon:{
                //数据列表请求参数
                tb:null//function
            },
            dataTable:null//dataTable option
        };
        var defaultInit = {
            tb: function () {
                //初始化表格
                Common.init.dataTable(option.id.tb,$.extend({
                    ajax: {
                        url: option.url.LIST,
                        dataSrc: 'data',
                        type: 'POST',
                        traditional:true,
                        data: function (d) {
                            var param = {} ;
                            if(option.param.tb)
                                param = option.param.tb() ;
                            else
                                param = $('#' + option.id.queryForm).serializeObject() ;

                            if(option.paramAddon.tb)
                                $.extend(param,option.paramAddon.tb()) ;

                            return $.extend({pageNo: $('#' + option.id.tb).DataTable().page() + 1}, d, param);
                        }
                    },
                    columns: option.columns
                },option.dataTable)) ;
            },
            btnSave: function () {
                //初始化保存事件
                $('#' + option.id.btnSave).unbind('click');
                $('#' + option.id.btnSave).click(function () {
                    if (!$('#' + option.id.editForm).form('validate')) return;
                    if(option.eventx.onPreSave )
                        if(!option.eventx.onPreSave())
                            return ;

                    _ret.post.sou(option.callback.sou);
                });
            },
            checkboxAllCheck: function () {
                //列表上全选功能,
                // 1.为每一个表格单独增加这个勾选的功能
                $(".table").each(function () {
                    var $oneTable = $(this);
                    $oneTable.find('thead tr th :checkbox').unbind('click');
                    $oneTable.on('click', 'thead tr th :checkbox', function () {
                        var f = false;
                        if ($(this).prop('checked'))
                            f = true;
                        $oneTable.find("tr :checkbox").prop('checked', f);
                    });
                });
            },
            checkboxRowCheck: function () {
                //列表上单选功能,
                // 1.为每一个表格单独增加这个勾选的功能
                $(".table").each(function () {
                    var $oneTable = $(this);
                    $oneTable.find('tbody tr td :checkbox').unbind('click');
                    $oneTable.on('click', 'tbody tr td :checkbox', function () {
                        var all = $oneTable.find("tbody tr :checkbox").length;
                        var checked = $oneTable.find("tbody tr :checked").length;
                        var f = checked === all ? true : false;
                        $oneTable.find("thead th :checkbox").prop('checked', f)
                    });
                });

            },
            btnEdit: function () {
                //编辑
                $('#' + option.id.btnEdit).unbind('click');
                $('#' + option.id.btnEdit).click(option.rebind.edit || function () {
                    var checked = getChecked();
                    if (checked.length === 0) {
                        Application.notify.warning('请选择一条数据.');
                        return;
                    }
                    if (checked.length > 1) {
                        Application.notify.warning('只能选择一条数据编辑.');
                        return;
                    }
                    var id = checked[0][option.primaryKey];
                    _ret.post.edit(id,option.callback.edit);
                });
            },
            btnDel: function () {
                //删除
                $('#' + option.id.btnDel).unbind('click');
                $('#' + option.id.btnDel).click(option.rebind.del || function () {
                    var checked = getChecked();
                    if (checked.length === 0) {
                        Application.notify.warning('请选择一条数据.');
                        return;
                    }
                    Application.confirm("确定要删除这些数据么?", function (r) {
                        if (r) {
                            var ary = [];
                            for (var i = 0; i < checked.length; i++) {
                                ary.push(checked[i][option.primaryKey]);
                            }
                            //一条数据时,增加一个id为0的,容错
                            if (checked.length === 1)
                                ary.push(0);
                            _ret.post.del(ary);
                        }
                    });

                });
            },
            btnQuery: function () {
                //查询按钮初始化
                $('#' + option.id.btnQuery).unbind('click');
                $('#' + option.id.btnQuery).click(function () {
                    $('#' + option.id.tb).DataTable().ajax.reload();
                    $('#' + option.id.tb).find(':checkbox').prop('checked',false ) ;
                });
            },
            btnReset: function () {
                //重置按钮初始化
                $('#' + option.id.btnReset).unbind('click');
                $('#' + option.id.btnReset).click(function () {
                    if(option.callbackx.reset) {
                        $('#' + option.id.queryForm).form("reset");
                        option.callbackx.reset() ;
                    }
                    else {
                        $('#' + option.id.queryForm).form("reset");
                    }

                });
            },
            onEditModalClosed: function () {
                //编辑框关闭时,清空表单
                $('#' + option.id.editModal).unbind('hidden.bs.modal');
                $('#' + option.id.editModal).on('hidden.bs.modal', function (e) {
                    $('#' + option.id.editForm).form("reset");
                    $('#' + option.id.editForm).validator('destroy');
                    if(option.eventx.onEditModalClosed)
                        option.eventx.onEditModalClosed() ;
                });
            },
            onEditModalShown: function () {
                //编辑框开启完成后
                $('#' + option.id.editModal).unbind('shown.bs.modal');
                $('#' + option.id.editModal).on('shown.bs.modal', function (e) {
                    option.eventx.onEditModalShown && option.eventx.onEditModalShown() ;
                });
            }
        };

        var init = function (opt) {
            if (opt) {
                $.extend(option,opt) ;
            }
            if(!option.url.SOU) {
                option.url.SOU = appCtx + "/" + option.pageType +"/" + option.modelName + "/sou.do" ;
            }
            if(!option.url.DEL) {
                option.url.DEL = appCtx + "/" + option.pageType +"/" + option.modelName + "/del.do" ;
            }
            if(!option.url.LIST) {
                option.url.LIST = appCtx + "/" + option.pageType +"/" + option.modelName + "/list.do" ;
            }
            if (!option.url.EDIT) {
                option.url.EDIT = appCtx + "/" + option.pageType +"/" + option.modelName + "/edit_json.do" ;
            }

            for (var item in defaultInit) {
                //排除的tag,跳过,自己实现function
                if(_ret.getOption().exclude.contains(item))
                    continue ;
                defaultInit[item].call();
            }
        }

        //客户端操作
        var client = {
            editForm: function (id) {
                $('#' + option.id.editModal).modal('show');
                $('#' + option.id.editModal + ' input:not(:hidden):first').focus() ;
                _ret.post.edit(id,option.callback.edit);
            },
            del: function (id) {
                Application.confirm("确定要删除么?", function (r) {
                    if (r)
                        _ret.post.del([id, -1]);
                });
            }
        } ;

        //服务端请求
        var post = {
            sou: function (func) {
                var param = null ;
                if(option.param.post.sou)
                    param = option.param.post.sou() ;
                else
                    param = $('#' + option.id.editForm).serializeObject() ;

                $.ajax({
                    type: "post",
                    url: option.url.SOU,
                    data: param,
                    traditional:true,
                    success: func || function(data) {
                        if (data.success) {
                            Application.notify.success();
                            $('#' + option.id.tb).DataTable().ajax.reload();
                            $('#' + option.id.editModal).modal('hide');
                            $('#' + option.id.tb).find(':checkbox').prop('checked',false ) ;
                            //加一个回调方法
                            if (option.callbackx.sou)
                                option.callbackx.sou(data);
                        }
                        else {
                            Application.notify.error(data.message);
                        }
                    }
                });
            },
            edit: function (id,call) {
                $.post(
                    option.url.EDIT,
                    {
                        id: id
                    },
                    call || function (data) {
                        if (data.success) {
                            $('#' + option.id.editModal).modal('show');
                            $('#' + option.id.editForm).form("load", data.data);
                            if(option.callbackx.edit)
                                option.callbackx.edit(data.data)
                        }
                    });
            },
            del: function (ary) {
                $.post(
                    option.url.DEL,
                    {
                        id: ary
                    },
                    function (data) {
                        if (data.success) {
                            Application.notify.success();
                            $('#' + option.id.tb).DataTable().ajax.reload();
                            $('#' + option.id.tb).find(':checkbox').prop('checked',false ) ;
                            if(option.callbackx.del)
                                option.callbackx.del(data.data)
                        }
                        else {
                            Application.notify.error(data.message);
                        }
                    });
            }
        }

        function getOption() {
            return option ;
        }
        /**
         * 获取勾选的数据
         * @returns {*|jQuery}
         */
        function getChecked() {
            return $('#' + option.id.tb).DataTable().rows('tr:has(\':checked\')').data();
        }
        var _ret = {
            init: init,
            client: client,
            post: post,
            getOption:getOption
        };
        return _ret;
    }
};
