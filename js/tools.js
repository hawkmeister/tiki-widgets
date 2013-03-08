define([
    'jquery', 
    'underscore',
    'backbone',
    'moment',    
    './base',
    './tools',    
], function($, _, Backbone, moment, gui, tools) {


    var tools = {};



    function reverseSortBy(sortByFunction) {
        return function(left, right) {
            var l = sortByFunction(left);
            var r = sortByFunction(right);

            if (l === void 0) return -1;
            if (r === void 0) return 1;

            return l < r ? 1 : l > r ? -1 : 0;
        };
    }



    tools.FileDropper = Backbone.View.extend({
        tagName: 'div',
        className: 'dropupload',
        attributes: {
            'ondragover': "return false"
        },
        events: {
            // 'dragover': 'onDragOver',
            'drop': 'onDrop',
        },    
        initialize: function(config) {
            if(config.el) {
                $(config.el).attr(this.attributes).addClass(this.className);
            }
        },
        render: function() {
            return this;
        },
    
        onDragOver: function(e) {
            e.preventDefault(); 
            return false;
        },
        onDrop: function(e) {
            // Prevent the default behavior of opening a dropped file
            e.preventDefault();
        
            // Get all dropped files
            var files = e.originalEvent.dataTransfer.files;
    
            // Re-trigger the origial "drop" event, with the spaceholders added.
            var ev = _.extend({}, e, {files: files});
            this.trigger('drop', ev);
        }    
    });


    tools.Float = Backbone.View.extend({
        
        initialize: function(config) {
            _.bindAll(this, 'onScroll');
            $(window.document).on('scroll', this.onScroll);
            this.pos = this.$el.offset();
            this.width = this.$el.width();
            this.height = this.$el.height();
            this.position = this.$el.css('position');
            $(window.document).trigger('scroll');
        },
        onScroll: function(e) {
            if(!this.el.parentElement) return;
            
            this.pos = this.$el.offset();
            this.width = this.$el.width();
            this.height = this.$el.height();
            this.position = this.$el.css('position');
            
            var scrollTop = e.target.body.scrollTop,
                viewportHeight = $(window).height(),
                above = this.pos.top < scrollTop,
                below = this.pos.top+this.height > scrollTop + viewportHeight;             

            if(above && !this.clone) {
                this.flyTop();
            }
            else if(below && !this.clone) {
                this.flyBottom();                
            }
            else if(!above && !below && this.clone) {
                this.land();
            }
        },
        createClone: function() {
            // $el.clone() does a deep clone. 
            // Passing true clones events and data as well.
            return this.$el.clone(true).insertAfter(this.el).addClass('flying');
        },
        flyTop: function() {
            this.clone = this.createClone();
            this.clone.css({
                position: 'fixed',
                top: 0,
                left: this.pos.left,
                width: this.width,
                height: this.height
            });
        },
        flyBottom: function() {
            this.clone = this.createClone();            
            this.clone.css({
                position: 'fixed',
                bottom: 0,
                left: this.pos.left,
                width: this.width,
                height: this.height
            });
        },        
        land: function() {
            this.clone.remove();
            this.clone = null;
            // this.$el.css({
            //     position: this.position,
            //     top: 'auto',
            //     left: 'auto',
            //     width: 'auto',
            //     height: this.height
            // })
            // this.$el.removeClass('flying');
        }
    });


    // keydown enter .selector
    // click .selector
    var splitter = /^(\S+)\s+(\S+)\s*(.*)$/
    // var eventSplitter = /^(\S+)\s*(.*)$/;
    
    
    /**
    Example 1
    ---------
    this.selectable = new tools.Selectable({
        el: this.el,              // common ancestor for the selectables
        selectables: 'li',        // a selector expression
        chooseOnClick: true,
        chooseOnDblClick: false,

        // triggerChooseOn: ['keydown enter', 'mousedown li'] // this is not yet implemented        
    });
    this.selectable.on('choose', this.onSelectableChoose, this);
    */
    tools.Selectable = Backbone.View.extend({
        // events: {
        //     'keydown': 'onSelectableKeyDown',
        // },

        
        /*        
        var s = Selectable({
            el: '#table',
            selectable: 'td'
        });
        s.render();
        */
        initialize: function(config) {
            _.bindAll(this, 'onSelectableMouseDown', 'onSelectableDblClick', 'onSelectableKeyDown')
            this.selectables = config.selectables;
            this.$el.on('keydown', this.onSelectableKeyDown);            
            this.$el.on('mousedown', config.selectables, this.onSelectableMouseDown);
            
            // Todo: Replace this semi-silly arguments with the out-commented code below?
            if(config.chooseOnDblClick)
                this.$el.on('dblclick', config.selectables, this.onSelectableDblClick);
            if(config.chooseOnClick)
                this.$el.on('click', config.selectables, this.onSelectableDblClick);            
            
        
            // this.triggerChooseOn = config.triggerChooseOn || ['keydown enter', 'dblclick li'];
            // _.each(this.triggerChooseOn, function(evtstr) {
            //     var matches = evtstr.match(splitter),
            //         eventName = match[1], 
            //         hotkey = match[2] || '',
            //         selector = match[3] || '';
            //                         
            //     if(_.indexOf(['keydown', 'keypress', 'keyup')], matches[1]) {
            //         // register hotkey
            //         this.$el.on(eventName, selector || null, hotkey, this.chooseSelected);
            //     } else {
            //         this.$el.on(eventName, match[2] + ' ' + match[3], this.chooseSelected);                    
            //     }
            // })
        },

        off: function() {
            this.$el.off('mousedown', this.selectables, this.onSelectableMouseDown);
            this.$el.off('dblclick', this.selectables, this.onSelectableDblClick);            
            this.$el.off('keydown', this.onSelectableKeyDown);            
        },
        onSelectableMouseDown: function(e) {
            var el = $(e.currentTarget);
        
            if(e.metaKey) {
                this.toggle(el);
                el.make('head');
            }
            else if(e.shiftKey) {
                var a = this.$('.tail').index(),
                    b = el.index(),
                    start = Math.min(a,b),
                    end = Math.max(a,b);
                this.deselectAll();
                this.$(this.selectables).slice(start, end+1).addClass('selected');
                el.make('head');
            
                // Allow text selection, but no shift-click text selection
                e.preventDefault();
                gui.iepreventTextSelection(e);
            }
            else {
                this.selectOne(el);
                // this.trigger('choose', {selected: el});
            }
        },
        onSelectableDblClick: function(e) {
            var el = $(e.currentTarget);
            this.selectOne(el);
            this.trigger('choose', {selected: el});
        },
        getSelected: function() {
            return this.$(this.selectables).filter('.selected');
        },
        getSelectedModels: function(collection) {
            return this.getSelected().map(function() {
                return collection.at($(this).index());
            }).toArray();
        },
        getSelectables: function() {
            return this.$(this.selectables);
        },
        toggle: function(el) {
            if($(el).is('.selected')) 
                this.deselect(el);
            else
                this.select(el);
        },
        select: function(el) {
            if(_.isNumber(el)) {
                el = this.$(this.selectables+':nth-child('+el+')')
            }
            $(el).addClass('selected');
            this.trigger('select', {selected: this.getSelected()});
            this.trigger('change');
        },
        selectOne: function(el) {
            if(!el || !el[0])
                el = this.$(this.selectables+':visible:first');
            this.deselectAll();
            this.select(el);
            el.make('head').make('tail');
        },
        selectAll: function() {
            this.deselectAll();
            this.$(this.selectables).addClass('selected');
            this.$(this.selectables).first().addClass('tail');
            this.$(this.selectables).last().addClass('head');
            this.trigger('select');
            this.trigger('change');
        },
        deselect: function(el) {
            $(el).removeClass('selected');
            this.trigger('deselect');
            this.trigger('change');
        },
        deselectAll: function() {
            this.$('.selected').removeClass('selected');
            this.$('.head').removeClass('.head');
            this.$('.tail').removeClass('.tail');
        },
        moveUp: function(steps) {

        },
        moveDown: function(steps) {
        
        },
        selectRight: function() {
            
        },
        selectLeft: function() {
            
        },
        selectUp: function() {
            
        },
        selectDown: function() {
            
        },
        
        
        onSelectableKeyDown: function(e) {
            if(e.which == gui.keys.ENTER) {
                var sel = this.getSelected();
                if(sel[0]) {
                    this.trigger('choose', {selected: sel});
                }
                e.preventDefault();
            }
            else if(gui.isArrowKey(e)) {
                e.preventDefault();
                if(!this.$('.selected').length) {
                    this.selectOne()
                    return
                }
                
                var head = this.$('.head'),
                    tail = this.$('.tail'),
                    prev = head.prevAll(':visible:first'),
                    next = head.nextAll(':visible:first');

                // within visible viewport? next, down and outside?
                if(e.which == gui.keys.DOWN)
                    if(next[0]) {
                        var height = next.outerHeight(),
                            bottom = next[0].offsetTop+height,
                            diff = bottom - this.$el.outerHeight();
                        if(bottom > this.$el.outerHeight()) {
                            this.$el.scrollTop(diff+8);
                        }
                    }

                // next[0].scrollIntoView(); //e.which == gui.keys.UP alignWithTop
                // next.css('border', '1px solid blue');
                e.preventDefault();
                e.stopPropagation()
            
                if(!e.shiftKey) {
                    if(e.which == gui.keys.DOWN && next[0]) 
                        this.selectOne(tail.nextAll(':visible:first'));
                    else if(e.which == gui.keys.UP && prev[0]) 
                        this.selectOne(tail.prevAll(':visible:first'));
                }    
                else {            
                    if(e.which == gui.keys.DOWN && next[0]) {
                        var below = head.index() >= tail.index() 
                        if(below) {
                            this.select(next);
                            next.make('head');
                        } else {
                            this.deselect(head);
                            next.make('head');
                        }
                    }
                    else if(e.which == gui.keys.UP && prev[0]) {
                        var below = head.index() > tail.index()
                        if(below) {
                            this.deselect(head);
                            prev.make('head');
                        } else {
                            this.select(prev);
                            prev.make('head');
                        }
                    }
                }
            }
        }
    });





    /*
    Example:
    -----------------
    this.table = new gui.Table({
        columns: [
            {name: 'title', title: 'Title', width: '40%'},
            {name: 'col2', title: 'Column B', width: '60%'},
        ],
        rows: [
            {title: 'Feppo', col2: 'Sune'},
            {title: 'Heppo', col2: 'Sune'},
            {title: 'Lorem', col2: 'Ipsum'},
        ]
    });
    
    */
    
    tools.TableColumnModel = Backbone.Model.extend({
        defaults: {
            visible: true,
            sort: null, //'asc',
            sortprio: null , // 1
            name: null, // 'title'
            title: null, // 'Title',
            
        }
    });
    
    tools.TableColumn = Backbone.View.extend({
        tagName: 'th',
        template: _.template2(''+
            '<div>'+
                '<i></i>' + 
                '${obj.title}'+
                '<span class="sort ${obj.sort || ""}"></span>' +
                '<span class="resize ui-draggable"></span>' +
            '</div>'), 
        events: {
            'click': 'onClick',
            'dragdown': 'onDragDown',
            'draginit': 'onDragInit',
            'dragend': 'onDragEnd',
            'dragover': 'onDragOver'
        },
            
        initialize: function(config) {
            this.config = config;
            this.model = config.model;
            if(!this.model)
                this.model = new tools.TableColumnModel();
        
            this.model.on('change:sort', this.onSortChange, this);
            
            
            // Table columns are draggable (for reordering columns)
            // this.$el
            // $('.mydraggable', 'ondraginit', function(e, drag) {
            //    drag.horizontal()
            //    drag.steps(...)
            //    drag.ghost()     <-- clone a ghost to follow the mouse pointer.
            //    // ..etc, configure the drag here..
            // 
            //    drag.element    <-- the (jquery) element dragged
            //    drag.delegate   <-- the parent-ish element (eg .acm-desktop) that 'dragstart' is registerd to. (Often you bind one listener on a container element instead of multiple listeners on each individual child)
            // 
            // });
        },
        onDragDown: function(e, drag) {
            e.preventDefault()
            drag.mousedownPosition = {left: e.offsetX, top: e.offsetY};
            drag.distance(5);
        },
        onDragOver: function(e, drag) {
            console.log('Over: ', e, drag)
        },

        onDragInit: function(e, drag) {
            console.log('Soooo pretty2: ', drag, 'e:', e)
            var tablecont = this.$el.parents('.gui-table');
            var foo = $('<div><div></div></div>').appendTo(document.body); // tablecont
            foo.children('div').html(this.$el.text());
            foo.css({width: this.$el.width(), height: tablecont.height()})
            foo.addClass('gui-table-column-ghost')
            drag.representative(foo, drag.mousedownPosition.left, drag.mousedownPosition.top)
            drag.ghostEl = foo;
            drag.columnModel = this.model;
            // drag.ghost();
            // drag.horizontal(0);
            
        },
        onDragEnd: function(e, drag) {
            drag.ghostEl.remove();
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
        onSortChange: function(model, newval, changedValues) {
            this.$('.sort').toggle(!!newval)
            if(newval) {
                this.$('.sort').html(newval)
            }
        },

        onClick: function(e) {
            // the click handler just updates the model
            
            return;
            
            var sort = this.model.get('sort')
            
            // var popup = new HypPopup({table: this.table, column: column});            
            // popup.show(e.target);
            if(!sort)
                this.model.set('sort', 'asc')
            else if(sort=='asc')
                this.model.set('sort', 'desc')
            else if(sort=='desc')
                this.model.set('sort', 'asc')
            
        },
        
    });
    
    tools.Table = Backbone.View.extend({
        tagName: 'div',
        className: 'gui-table',
        attributes: {
            tabindex: 0
        },
        template: _.template('' + 
            '<table>'+
                '<colgroup></colgroup>'+
                '<thead><tr></tr></thead>' + 
                '<tbody></tbody>' + 
            '</table>'),



        initialize: function(config) {
            config = config || {};
            if(config.el) {
                this.$el.attr(this.attributes);
            }

            // Add a columns collection
            if(config.columns instanceof Backbone.Collection)
                this.columns = config.columns;
            else
                this.columns = new Backbone.Collection(config.columns);
            this.columns.on('change:sort', this.onColumnSortChange, this)

            // Add a rows collection
            if(config.rows instanceof Backbone.Collection)
                this.rows = config.rows;
            else
                this.rows = new (Backbone.Collection.extend({url: config.url}))(config.rows);
            this.rows.on('add', this.onRowAdd, this);
            this.rows.on('destroy remove', this.onRowRemove, this);
            
            var tr = this.$('thead > tr');
            var rowTpl = [];
            var renderers = {};
            this.columns.each(function(col) {                
                // Append another <td> to the row template
                var renderer = col.get('renderer');
                if(renderer) {
                    // Call a given renderer function 
                    if(_.isString(renderer))
                        // use a named built-in renderer, see `tools.renderers`
                        renderer = tools.renderers[renderer]

                    renderers[col.get('name')] = function(row) { return renderer(row, col.toJSON()); };
                    rowTpl.push('${ renderers["'+col.get('name')+'"](obj) }');
                }
                else
                    // or just use the default cell markup
                    rowTpl.push('<td><div>${ obj.'+col.get('name')+' || "" }</div></td>');
            }, this);
            this.rowTemplate = _.template2('<tr id="${obj.id}">'+rowTpl.join('')+'</tr>', {renderers: renderers});            

            // Make the rows selectable
            this.selectable = new tools.Selectable({
                el: this.el,
                selectables: 'tbody tr'
            });            
        },
        render: function() {

            // Start by generate a skeleton
            this.$el.html(this.template());

            // ..add some column headers
            var tr = this.$('thead > tr'),
                colgroup = this.$('table > colgroup');

            this.columns.each(function(model) {
                // Create a <col> to the main table 
                var c = $('<col/>').css('width', model.get('width')).addClass(model.get('className'));
                colgroup.append(c);

                // Append a th to the header table                
                var th = new tools.TableColumn({model: model})
                tr.append(th.render().el);                    
            }, this);

            // ..and finally some rows, from this.rows, if any.
            var tbody = this.$('table > tbody');
            
            
            this.rows.each(function(row) {
                tbody.append(this.renderOne(row));
            }, this);

            
            // Make the columns resizable
            var o = {table: this};
            this.$('.resize').draggable({
                containment: 'parent', 
                axis: 'x',
                helper: false,
                cursor: 'col-resize',
                start: function(e, draginfo) {
                    $(this).css({'left': ''});
                    o.tableoffset = o.table.$el.offset().left;
                    o.tablewidth = o.table.$el.width();
                },
                drag: function(e, draginfo) {
                    var colwidth = e.pageX - o.tableoffset;
                    colwidth = (colwidth / o.tablewidth) * 100
                    var rest = 100-colwidth;
                    o.table.$('colgroup col:nth-child(1)').css({width: colwidth+'%'});
                    o.table.$('colgroup col:nth-child(2)').css({width: rest+'%'});                
                },
                stop: function() {
                    $(this).css({'left': ''});
                }
            });

            this.$('table.body').iefocus();
            this.$('>.head').ieunselectable();        
            return this;
        },
        renderOne: function(model) {
            return this.rowTemplate(model.toJSON());
        },
        onRowAdd: function(model, collection, options) {
            options = options || {};
            var tr = this.renderOne(model);
            this.$('table.body tbody').insertAt(options.index || -1, tr);
        },
        onRowRemove: function(model, collection) {
            var el = this.$el.find('#'+model.id);
            el.remove();
        },
        onColumnSortChange: function(column, sort) {

            if(sort) {            
                var fn = function(model) {
                    return model.get(column.get('name'));
                }
                if(sort == 'desc')
                    fn = reverseSortBy(fn)
            
                this.rows.comparator = fn;
            }
            
            this.rows.sort();
            this.render();                    
        }        
    });



    
    // Some common table column renderers
    tools.renderers = {
        'timeago': function(row, col) {
            var val = row[col.name];
            if(!val)
                return '<td><div></div></td>';
            return '<td><div>'+moment.utc(row[col.name]).local().fromNow()+'</div></td>';
        },
        'ymd': function(row, col) {
            var val = row[col.name];
            if(!val)
                return '<td><div></div></td>';
            return '<td><div>'+moment.utc(row[col.name]).local().format('YYYY-MM-DD')+'</div></td>';            
        }
    }









    /*
    Silly class assuming a lot of things.
    */
    tools.ItemTable = tools.Table.extend({    

        className: 'gui-table item-table',

        
        template: _.template('' + 
            '<div class="head"><table><colgroup></colgroup><thead><tr></tr></thead></table></div>'+
            '<div class="scroll">'+
                '<table class="body">'+
                    '<colgroup></colgroup>' +
                    '<tbody></tbody>' +
                '</table>'+
            '</div>'+
            '<div class="tools"><ul>'+
                '<li><button class="add">Add row</button></li>'+
            '</ul></div>'            ),        
        
        events: {
            'click .add': 'onAddClick',
            'click tr': 'onRowClick',
            'keydown': 'onKeyDown'
        },
        mixins: [
            gui.ChildView,
            // tools.selectable()
        ],
    
    
        initialize: function(config) {
            tools.ItemTable.__super__.initialize.call(this, config)
            this.filterView = config.filterView;  // optional
            if(this.filterView) {
                this.filterView.on('change', this.onFilterViewChange, this)
            }
            this.url = config.url;
            this.rows.url = config.url;
            this.rows.on('add', this.onRowAdd, this);
            this.rows.on('destroy remove', this.onRowRemove, this);            
        },
        render: function() {
            return tools.ItemTable.__super__.render.call(this)
        },
        comparator: function(row) {
            return row.get('period');
        },

        populate: function() {
            
        },
        onFilterViewChange: function() {
            var url = this.url + '?' + this.filterView.getQueryString();
            this.rows.url = url;
        },
        onAddClick: function() {
            this.trigger('addclick')
        },
        onRowClick: function(e) {
            this.$('tr.selected').removeClass('selected');
            $(e.target).parents('tr:first').addClass('selected')
        },
        onKeyDown: function(e) {
            // tools.ItemTable.__super__.onKeyDown.call(this, e);
            if(e.which == gui.keys.BACKSPACE && confirm('Delete this row?')) {
                var id = this.$('tr.selected').attr('id'),
                    row = this.rows.get(id);
                row.destroy();
            }
        },
        onRowAdd: function(model, collection, metadata) {
            // options = options || {};
            // var tr = this.rowTemplate(row.toJSON());
            // // this.$('tbody').insertAt(options.index || -1);
            // this.$('tbody').insertAt(options.index || -1);
            this.render();
            this.el.focus();
            this.selectable.selectOne(this.$('#'+model.id));
        },
        onRowRemove: function(row, collection) {
            var el = this.$el.find('#'+row.id);
            el.fadeOut(300, function() {this.remove();});
            var next = el.next();
            if(next[0]) 
                this.selectable.selectOne(el.next())
                // el.next().addClass('selected');
            else 
                this.selectable.selectOne(el.prev())            
                // el.prev().addClass('selected');
            this.el.focus();
        },    
        
    
    
    });
    


    /*    
    Filters:
    [date]          2012-11-01   2012-11-30     date/timedelta
    [invoice]                                   id/relation
    [hours]         >1                          int     
    [billable]      true
    [tags]          all/any [hyp]               List(Str)

    
    Date
    --------------------------------------------
    is
    between
    at least
    at most
    
    where 
        jget(data, 'date') >= 2012-11-01 and
        jget(data, 'date') <= 2012-11-30
    
    

    var f = new FilterView({
        filterType: 'and',
        filters: [{
                type: 'datetime',
                name: 'date',
                title: 'Date',
                predicate: 'between',
                value: [moment('2012-11-01),
                        moment('2012-11-30)]
            },{
                type: 'number',
                name: 'rate',
                title: 'Billable?',
                predicate: 'atleast',
                value: 1
            },{
                type: 'text',
                name: 'tags',
                title: 'Tags',
                predicate: 'is'
                value: 'hyp'
            }]
    });
    
    >>> f.getQueryString() 
    "?filtertype=and&date=between,2012-11-01,2012-11-30&rate=atleast,1&tags=is,hyp"
    
    
    /clients/448472/slaps?[...]
    
    
    Example 1
    -------------------------------------
    var filterview = new tools.FilterView({
        filterType: 'and',
        filters: [{
                name: 'paper_date',
                type: 'date', 
                title: 'Paper date', 
                defaults: {predicate: 'between', value: '2012-11-01', value2: '2012-11-15'}
            },{
                name: 'amount',
                type: 'number', 
                title: 'Amount', 
                defaults: {predicate: 'atleast'}
            },{
                name: 'comment',
                type: 'text', 
                title: 'Comments', 
                defaults: {predicate: 'contains'}
            }],
        state: [{
                name: 'paper_date',
                predicate: 'atleast',
                value: '2012-11-01',
            },{
                name: 'amount',
                predicate: 'atleast',
                value: '1000',
            },{
                name: 'comment',
                predicate: 'contains',
                value: 'foo',
            }]        
    });
    $(document.body).append(filterview.render().el);
    */




    /*
    A small single-line editor
    */
    tools.Edit = Backbone.View.extend({
        events: {
            'blur': 'finish'
        },
        hotkeys: {
            'keydown return': 'finish',
            'keydown left': 'foo',
            'keydown right': 'foo',
            'keydown up': 'foo',
            'keydown down': 'foo',
        },
        foo: function(e) {
            e.stopPropagation();
        },
        initialize: function(config) {
            this.config = config;
            this.$el.attr('contenteditable', 'true');
            this.$el.focus();
            this.$el.selectAll();
        },
        finish: function(e) {
            this.$el.attr('contenteditable', 'false');
            this.trigger('edit', {el: this.el, '$el': this.$el})
            if(e) {
                e.preventDefault();
                e.stopPropagation();
            }            
        }
    });



return tools;

});













