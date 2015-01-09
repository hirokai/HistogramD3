/** @jsx React.DOM */


var App = React.createClass({
    getInitialState() {
        return {values: [], totalWidth: 800, totalHeight: 500, margin: {top: 10, right: 30, bottom: 30, left: 30}};
    },
    render() {
        return <div className="row">
            <div className="col-md-9">
                <svg id='graph'></svg>
            </div>
            <div className="col-md-3">
                <textarea id="data" onChange={this.valuesChanged}></textarea>
            </div>
        </div>;
    },
    valuesChanged(ev) {
        var str = $(ev.nativeEvent.target).val();
        var values = _.chain(str.split('\n')).map((s) => parseFloat(s)).compact().value();
        this.setState({values: values});
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

    },
    componentDidUpdate() {
        this.updateGraph();
    },
    updateGraph() {
        var self = this;
        var svg = d3.select('#graph');
        svg.selectAll('*').remove();

        console.log(this.state.values);

        const vals = _.sortBy(this.state.values,(v) => v);
        const xmax = vals[Math.floor(vals.length *0.95)];
        const xmin = vals[Math.floor(vals.length *0.05)];
        console.log(xmin,xmax);
        var x = d3.scale.linear()
            .domain([xmin, xmax])
            .range([0, this.width()]);

        const vals_filtered = _.filter(vals, (v) => xmin < v < xmax)

        var data = d3.layout.histogram()
            .bins(x.ticks(20))(vals_filtered);

        console.log(data);

        var y = d3.scale.linear()
            .domain([0, d3.max(data, function (d) {
                return d.y;
            })])
            .range([this.height(), 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");


        console.log(data);
        var bar = svg.selectAll(".bar")
            .data(data)
            .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function (d) {
                return "translate(" + x(d.x) + "," + y(d.y) + ")";
            });


        bar.append("rect")
            .attr("x", 1)
            .attr("width", x(data[0].dx) - x(0))
            .attr("height", function (d) {
                return self.height() - y(d.y);
            });

        var formatCount = d3.format(",.0f");

        bar.append("text")
            .attr("dy", ".75em")
            .attr("y", 6)
            .attr("x", x(data[0].dx) / 2)
            .attr("text-anchor", "middle")
            .text(function (d) {
                return formatCount(d.y);
            });

        var svg = d3.select('#graph');
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + this.height() + ")")
            .call(xAxis);
    }
});

React.render(<App/>, document.getElementById('app-container'));

$(() => {
});