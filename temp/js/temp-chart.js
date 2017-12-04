const build_chart = function (channel_id) {



        var param = parseInt(window.location.hash.substring(1));
        var numberOfDays = isNaN(param) ? 1 : param;
        

        function dewPoint(t, rh) {
            var b = 237.7;
            var a = 17.27;
            var alpha = a*t/(b+t) + Math.log(rh/100);

            return b*alpha / (a - alpha); 
        }

        $(function () {

        /**
        * In order to synchronize tooltips and crosshairs, override the
        * built-in events with handlers defined on the parent element.
        */
            $('#container').bind('mousemove touchmove touchstart', function (e) {
                var chart,
                    point,
                    i,
                    event;

                for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                    chart = Highcharts.charts[i];
                    event = chart.pointer.normalize(e.originalEvent); // Find coordinates within the chart
                    point = chart.series[0].searchPoint(event, true); // Get the hovered point

                    if (point) {
                        point.highlight(e);
                    }
                }
            });

            /**
            * Override the reset function, we don't need to hide the tooltips and crosshairs.
            */
            Highcharts.Pointer.prototype.reset = function () {
                return undefined;
            };

            /**
            * Highlight a point by showing tooltip, setting hover state and draw crosshair
            */
            Highcharts.Point.prototype.highlight = function (event) {
                this.onMouseOver(); // Show the hover marker
                this.series.chart.tooltip.refresh(this); // Show the tooltip
                this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
            };

            /**
            * Synchronize zooming through the setExtremes event handler.
            */
            function syncExtremes(e) {
                var thisChart = this.chart;

                if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
                    Highcharts.each(Highcharts.charts, function (chart) {
                        if (chart !== thisChart) {
                            if (chart.xAxis[0].setExtremes) { // It is null while updating
                                chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, { trigger: 'syncExtremes' });
                            }
                        }
                    });
                }
            }

            activity = {
                "datasets": [{
                "name": "temp",
                "data": [],
                "unit": '°C',
                "type": "line",
                "valueDecimals": 1,
                "ymin": -10,
                "ymax": 35
            }, {
                "name": "humidity",
                "data": [],
                "unit": "%",
                "type": "line",
                "valueDecimals": 1,
                "ymax": 100
            },{
                "name": "dew point",
                "data": [],
                "unit": '°C',
                "type": "line",
                "valueDecimals": 1
            }, {
                "name": "in",
                "data": [],
                "unit": 'V',
                "type": "line",
                "valueDecimals": 3,
                "ymin":3,
                "ymax":3.5
            }]};

            var my_offset = new Date().getTimezoneOffset();
            
            function getChartDate(d) {
                // offset in minutes is converted to milliseconds and subtracted so that chart's x-axis is correct
                return Date.parse(d) - (my_offset * 60000);
            }

            var jsonData = $.ajax({
                url: 'https://api.thingspeak.com/channels/' + channel_id + '/feeds.json?days=' + numberOfDays,
                dataType: 'jsonp'
            }).done(function (results) {
                $.each(results.feeds, function (i, row) {
                    var date = getChartDate(row.created_at);
                    var temp = parseFloat(row.field1);
                    var rh = parseFloat(row.field2);
                    var vin = parseFloat(row.field3);
                    if(temp < 100 && rh <= 100) {
                        activity.datasets[0].data.push([date, temp]);
                        activity.datasets[1].data.push([date, rh]);
                        activity.datasets[2].data.push([date, dewPoint(temp, rh)]);
                        activity.datasets[3].data.push([date, vin]);
                    }
                });

                $.each(activity.datasets, function (i, dataset) {
                    $('<div class="chart">')
                    .appendTo('#container')
                    .highcharts({
                        chart: {
                            marginLeft: 40, // Keep all charts left aligned
                            spacingTop: 20,
                            spacingBottom: 20
                        },
                        title: {
                            text: dataset.name,
                            align: 'left',
                            margin: 0,
                            x: 30
                        },
                        credits: {
                            enabled: false
                        },
                        legend: {
                            enabled: false
                        },
                        xAxis: {
                            crosshair: true,
                            events: {
                                setExtremes: syncExtremes
                            },
                            type: 'datetime',
                            tickInterval: 12 * 3600 * 1000,
                            tickWidth: 0,
                            gridLineWidth: 1,
                            labels: {
                                align: 'left',
                                x: 3,
                                y: -3
                            }
                        },
                        yAxis: {
                            title: {
                                text: null
                            },
                            plotBands: [{
                                from: 0,
                                to: -50,
                                color: 'rgba(255, 100, 100, 0.1)'
                            }],
                            min: dataset.ymin,
                            max: dataset.ymax
                        },
                        tooltip: {
                            borderWidth: 0,
                            backgroundColor: 'none',
                            formatter: function() {
                                return  '<b>' + Highcharts.numberFormat(this.y, dataset.valueDecimals) + dataset.unit + '</b><br> ' +
                                    Highcharts.dateFormat('%d %b %H:%M', this.x);
                            },
                            headerFormat: '',
                            shadow: false,
                            style: {
                                fontSize: '18px'
                            }
                        },
                        series: [{
                            data: dataset.data,
                            name: dataset.name,
                            type: dataset.type,
                            lineWidth: 0,
                            marker: {
                                enabled: true,
                                radius: 2
                            },
                            states: {
                                hover: {
                                    lineWidthPlus: 0
                                }
                            },
                            color: Highcharts.getOptions().colors[i],
                            fillOpacity: 0.3,
                            tooltip: {
                                valueSuffix: dataset.unit
                            }
                        }]
                    });
                });
            });
        });

}