/** @jsx React.DOM */

var DataBox = React.createClass({
    render() {
        return <div>
            <textarea className="data" id="data1" onChange={this.onChange} onPaste={this.onPaste} defaultValue={this.props.defaultValue.join('\n')}></textarea>
        </div>;
    },
    onChange(ev) {
        var values = _.chain($(ev.nativeEvent.target).val().split('\n')).map((s) => parseFloat(s)).compact().value();
        this.props.onChange(this.props.id, values);
    }
    //onPaste(ev){
    //    console.log('onPaste',ev);
    //    const el = $(ev.nativeEvent.target);
    //    var values = _.chain(el.val().split('\n')).map((s) => parseFloat(s)).compact().value();
    //    el.val(values.join('\n'));
    //}
});

var App = React.createClass({
    getInitialState() {
        const cs = d3.scale.category10();
        const str = localStorage['HistogramD3-values'];
        const vs = str ? JSON.parse(str) : {};
        console.log(vs);
        return {values: vs,
            colors: {dat1: cs(0), dat2: cs(1), dat3: cs(2), dat4: cs(3)}
            , totalWidth: 600, totalHeight: 500, margin: {top: 10, right: 30, bottom: 30, left: 30}};
    },
    render() {
        return <div className="row">
            <div className="col-md-7">
                <svg id='graph'></svg>
            </div>
            <div className="col-md-5" id="data-div">
                <DataBox id="dat1" onChange={this.valuesChanged} defaultValue={this.state.values['dat1'] || []}></DataBox>
                <DataBox id="dat2" onChange={this.valuesChanged} defaultValue={this.state.values['dat2'] || []}></DataBox>
                <DataBox id="dat3" onChange={this.valuesChanged} defaultValue={this.state.values['dat3'] || []}></DataBox>
                <DataBox id="dat4" onChange={this.valuesChanged} defaultValue={this.state.values['dat4'] || []}></DataBox>
            </div>
        </div>;
    },
    valuesChanged(id,values) {
        var vs = _.extend({}, this.state.values);
        vs[id] = values;
        localStorage.setItem('HistogramD3-values',JSON.stringify(vs));
        this.setState({values: vs});
    },
    width(){
      return this.state.totalWidth - this.state.margin.left - this.state.margin.right;
    },
    height(){
        return this.state.totalHeight - this.state.margin.top - this.state.margin.bottom;
    },
    componentDidMount() {
        var self = this;
        // Generate a Bates distribution of 10 random variables.
        var values = d3.range(1000).map(d3.random.bates(10));

// A formatter for counts.
        var formatCount = d3.format(",.0f");

        var x = d3.scale.linear()
            .domain([0, 1])
            .range([0, this.width()]);

// Generate a histogram using twenty uniformly-spaced bins.
        var data = d3.layout.histogram()
            .bins(x.ticks(20))
        (values);

        var y = d3.scale.linear()
            .domain([0, d3.max(data, function (d) {
                return d.y;
            })])
            .range([this.height(), 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");


        var svg = d3.select('#graph')
            .attr("width", this.state.totalWidth)
            .attr("height", this.state.totalHeight);

        var bar = svg.selectAll(".bar")
            .data(data)
            .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function (d) {
                return "translate(" + x(d.x) + "," + y(d.y) + ")";
            });

        bar.append("rect")
            .attr("x", 1)
            .attr("width", x(data[0].dx) - 1)
            .attr("height", function (d) {
                return self.height() - y(d.y);
            });

        bar.append("text")
            .attr("dy", ".75em")
            .attr("y", 6)
            .attr("x", x(data[0].dx) / 2)
            .attr("text-anchor", "middle")
            .text(function (d) {
                return formatCount(d.y);
            });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + this.height() + ")")
            .call(xAxis);

        this.updateGraph();

    },
    componentDidUpdate() {
        this.updateGraph();
    },
    updateGraph() {
        var self = this;
        var svg = d3.select('#graph');
        svg.selectAll('*').remove();

        const series = _.filter(Object.keys(this.state.values),(k) => k && this.state.values[k].length > 1);

        const ignore = 0.01;
        //const xmax = vals[Math.floor(vals.length *(1-ignore))];
        //const xmin = vals[Math.floor(vals.length *ignore)];
        const xmax = 10000;
        const xmin = 0;

        var x = d3.scale.linear()
            .domain([xmin, xmax])
            .range([0, this.width()]);
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + this.height() + ")")
            .call(xAxis);
        _.map(series,(id,i) =>{
            const vals = _.sortBy(this.state.values[id],(v) => v);
            if(vals.length > 0){
                const vals_filtered = _.filter(vals, (v) => xmin < v < xmax);
                var data = d3.layout.histogram()
                    .bins(x.ticks(20))(vals_filtered);
                const ymax = d3.max(data,(d) => d.y);
                this.drawSeries(series.length,i,id,x,xmin,xmax,data,ymax);
            }
        });

    }
    ,drawSeries(numSeries,idx,id,x,xmin,xmax,data,ymax){
        const self = this;
        const widthFactor = 0.8;

        var svg = d3.select('#graph');

        var y = d3.scale.linear()
            .domain([0, ymax])
            .range([this.height(), 0]);

        console.log(data);
        var bar = svg.selectAll(".bar-"+idx)
            .data(data)
            .enter().append("g")
            .attr("class", "bar bar-"+idx)
            .attr("transform", function (d) {
                return "translate(" + (x(d.x)+ (x(data[0].dx) - x(0))/numSeries*idx*widthFactor) + "," + y(d.y) + ")";
            });


        bar.append("rect")
            .attr("x", 1)
            .attr("width", (x(data[0].dx) - x(0))/numSeries*widthFactor)
            .attr("height", function (d) {
                return self.height() - y(d.y);
            })
            .style('fill',self.state.colors[id]);

        var formatCount = d3.format(",.0f");

        console.log(self.state.colors);

        bar.append("text")
            .attr("dy", ".75em")
            .attr("y", 6)
            .attr("x", x(data[0].dx) /numSeries*idx*widthFactor/ 2)
            .attr("text-anchor", "middle")
            .text( (d)=> d.y > 0 ? formatCount(d.y) : '');

        var svg = d3.select('#graph');

    }
});

React.render(<App/>, document.getElementById('app-container'));

$(() => {
});