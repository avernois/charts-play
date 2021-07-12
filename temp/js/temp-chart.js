function amcharts(channel) {
    var param = parseInt(window.location.hash.substring(1));
    var numberOfDays = isNaN(param) ? 15 : param;

    am4core.ready(function() {
    
        // Themes begin
        am4core.useTheme(am4themes_dark);
        am4core.useTheme(am4themes_animated);
        // Themes end
        
        // Create chart instance
        var chart = am4core.create("chartdiv", am4charts.XYChart);
        
        //
        
        // Increase contrast by taking evey second color
        chart.colors.step = 2;
        
        // Add data
        update_data(channel_id, numberOfDays).then(data => {
            chart.data = data
            createAxisAndSeries("temp", "Temp", false, "triangle", {min: -10, max: 45});
            createAxisAndSeries("humidity", "Humidity", true, "circle", {min: 0, max: 110});
            createAxisAndSeries("vcc", "Vcc", true, "rectangle", {min: 3, max: 4.5});
        });
        
        // Create axes
        var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
        dateAxis.renderer.minGridDistance = 50;
        dateAxis.tooltipDateFormat = "yyyy-MM-dd HH:mm";
    
        // Create series
        function createAxisAndSeries(field, name, opposite, bullet, range) {
          var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
          valueAxis.min = range.min;
          valueAxis.max = range.max;
          valueAxis.cursorTooltipEnabled = false
          if(chart.yAxes.indexOf(valueAxis) != 0){
              valueAxis.syncWithAxis = chart.yAxes.getIndex(0);
          }
          
          var series = chart.series.push(new am4charts.LineSeries());
          series.dataFields.valueY = field;
          series.dataFields.dateX = "date";
          series.strokeWidth = 2;
          series.yAxis = valueAxis;
          series.name = name;
          series.tooltipText = "{name}: [bold]{valueY}[/]";
          series.tensionX = 1;
          series.tensionY = 1;
          series.showOnInit = true;
          
          var interfaceColors = new am4core.InterfaceColorSet();
          
          switch(bullet) {
            case "triangle":
              var bullet = series.bullets.push(new am4charts.Bullet());
              bullet.width = 12;
              bullet.height = 12;
              bullet.horizontalCenter = "middle";
              bullet.verticalCenter = "middle";
              
              var triangle = bullet.createChild(am4core.Triangle);
              triangle.stroke = interfaceColors.getFor("background");
              triangle.strokeWidth = 2;
              triangle.direction = "top";
              triangle.width = 12;
              triangle.height = 12;
              break;
            case "rectangle":
              var bullet = series.bullets.push(new am4charts.Bullet());
              bullet.width = 10;
              bullet.height = 10;
              bullet.horizontalCenter = "middle";
              bullet.verticalCenter = "middle";
              
              var rectangle = bullet.createChild(am4core.Rectangle);
              rectangle.stroke = interfaceColors.getFor("background");
              rectangle.strokeWidth = 2;
              rectangle.width = 10;
              rectangle.height = 10;
              break;
            default:
              var bullet = series.bullets.push(new am4charts.CircleBullet());
              bullet.circle.stroke = interfaceColors.getFor("background");
              bullet.circle.strokeWidth = 2;
              break;
          }
          
          valueAxis.renderer.line.strokeOpacity = 1;
          valueAxis.renderer.line.strokeWidth = 2;
          valueAxis.renderer.line.stroke = series.stroke;
          valueAxis.renderer.labels.template.fill = series.stroke;
          valueAxis.renderer.opposite = opposite;
        }
        
        // Add legend
        chart.legend = new am4charts.Legend();
        
        // Add cursor
        chart.cursor = new am4charts.XYCursor();
        
        async function update_data(channel, numberOfDays) {
            const url = "https://api.thingspeak.com/channels/" + channel +"/feeds.json?days=" + numberOfDays +"&average=60&round=1"
            
            const response = await fetch(url, { method: 'GET' })
            const data = await response.json()
            const chartData = []
            const feeds = data.feeds
            feeds.forEach(element => {
                    chartData.push({
                        date: new Date(element.created_at),
                        temp: element.field1,
                        humidity: element.field2,
                        vcc: element.field3
                    });
                });
    
            return chartData;
        }
        
        }); // end am4core.ready()
}