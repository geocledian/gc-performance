/*
 Vue.js Geocledian performance chart component

 init script for using the component without any existent outer Vue instance

 created: 2022-10-07, jsommer
 updated: 2022-10-07, jsommer
 version: 0.1
*/
"use strict";

//language strings
const gcPerformanceLocales = {
  "en": {
    "options": { "title": "Crop performance comparison" },
    "description": { 
      "id": "ID",
      "parcel": "Parcel",
      "sdate": "Sensing date",
      "n_other_parcels": "Nb. of Parcels"
    },
    "date_format_hint": "YYYY-MM-DD",
  },
  "de": {
    "options": { "title": "Feldvergleich" },
    "description": { 
      "id": "Nr",
      "parcel": "Feld",
      "sdate": "Aufnahmedatum",
      "n_other_parcels": "Anzahl Felder"
    },
    "date_format_hint": "JJJJ-MM-TT",
  },
}

Vue.component('gc-performance', {
  props: {
    gcWidgetId: {
      type: String,
      default: 'performance1',
      required: true
    },
    gcApikey: {
      type: String,
      default: '39553fb7-7f6f-4945-9b84-a4c8745bdbec'
    },
    gcHost: {
      type: String,
      default: 'geocledian.com'
    },
    gcProxy: {
      type: String,
      default: undefined
    },
    gcApiBaseUrl: {
      type: String,
      default: "/agknow/api/v4"
    },
    gcApiSecure: {
      type: Boolean,
      default: true
    }, 
    gcParcelId: {
      default: -1
    },
    gcSelectedDate: {
      type: String,
      default: "" // date for sending against the API
    },
    gcSelectedDateStats: {
      type: Object,
      default: {}
    },
    gcAvailableOptions: {
      type: String,
      default: "title,description,dateSelector" // available options
    },
    gcWidgetCollapsed: {
      type: Boolean,
      default: true // or true
    },
    gcLanguage: {
      type: String,
      default: 'en' // 'en' | 'de'
    },
    gcWhiteLabel: {
      type: Boolean,
      default: false // true or false
    },
    gcCrop: {
      type: String,
      default: ""
    },
    gcEntity: {
      type: String,
      default: ""
    }
  },
  template: `<div :id="gcWidgetId" class="gc-performance" style="max-width: 18.0rem; min-width: 8rem;">       

              <p :class="['gc-options-title', 'is-size-6', gcWidgetCollapsed ? 'gc-is-primary' : 'gc-is-tertiary']" 
                style="cursor: pointer; margin-bottom: 1em;" 
                v-on:click="togglePerfchart"   
                v-show="this.availableOptions.includes('title')">
                {{ $t('options.title') }}
                <i :class="[gcWidgetCollapsed ? '': 'is-active', 'fas', 'fa-angle-down', 'fa-sm']"></i>
              </p>

              <!-- widget container -->
              <div :class="[gcWidgetCollapsed ? '': 'is-hidden']">
               <div class="is-flex">
                <div :id="'desc_' + gcWidgetId" class="gc-is-tertiary" v-show="this.availableOptions.includes('description')">
                  <!-- span class="has-text-weight-bold is-size-7">{{ $t('options.subtitle') }}</span><br -->
                  <span class="has-text-weight-bold is-size-7">{{ $t('description.parcel') }} {{ $t('description.id') }}: {{this.currentParcelID}}</span><br>
                  <span class="is-size-7">{{ $t('description.n_other_parcels') }}: {{this.performance.length}}</span><br>
                </div>

                <div class="field-body is-horizontal" style="margin-left: 1em;"
                    v-show="this.availableOptions.includes('dateSelector')">
                  <div class="control" style="padding-bottom: 0px; max-width: 5.8rem;">
                    <input :id="'inpSdate_'+this.gcWidgetId" type="text" class="input is-small" :placeholder="$t('date_format_hint')" style="height: 2.1rem;"
                      v-model="selectedDate">
                  </div>
                </div>
                </div>

                <!-- watermark -->
                <div :class="[this.gcWhiteLabel ? 'is-hidden': 'is-inline-block', 'is-pulled-right']"
                  style="opacity: 0.65;">
                  <span style="vertical-align: top; font-size: 0.7rem;">powered by</span><br>
                  <img src="img/logo.png" alt="geo|cledian" style="width: 100px; margin: -10px 0;">
                </div>
               

                <!-- watermark message -->
                <div class="notification gc-api-message" style="position: relative; opacity: 1.0; margin-bottom: 0.5rem; z-index: 1001; font-size: 0.9rem;"
                  v-show="watermark_msg.length>0" v-html="$t(watermark_msg)  +  '<br>' + $t('api_err_msg.support')">
                </div>
      
                <!-- other api messages -->
                <div class="notification gc-api-message" v-show="api_err_msg.length > 0" v-html="$t(api_err_msg) +  '<br>' + $t('api_err_msg.support')"></div>

                
                <div class="chartSpinner spinner" v-show="isloading">
                  <div class="rect1"></div>
                  <div class="rect2"></div>
                  <div class="rect3"></div>
                  <div class="rect4"></div>
                  <div class="rect5"></div>
                </div>

                <!-- v-show directive does not play nice with billboard.js so put it one layer above! -->
                <!-- div style="position: relative;" v-show="api_err_msg.length==0" -->
                <div style="position: relative; margin-top: 1.5em; margin-bottom: 1em;">
                  <div v-show="isloading == false">
                  <div>
                    <div :id="'chart_'+gcWidgetId" class="gc-performance-chart"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- chart -->`,
  data: function () {
    return {
      chart: undefined,
      ranking : undefined,
      inpSdatePicker: undefined,
      internalSelectedDate: "", //for internal use only
      api_err_msg: "",
      watermark_msg: "",
      isloading: true,
      internalSelectedDateStats: {}
    }
  },
  computed: {
    apiKey: {
      get: function () {
          return this.gcApikey;
      }
    },
    apiHost: {
        get: function () {
            return this.gcHost;
        }
    },
    apiBaseUrl: {
        get: function () {
            return this.gcApiBaseUrl;
      }
    },
    apiSecure: {
      get: function () {
          return this.gcApiSecure;
      }
    },
    apiMajorVersion: {
      get () {
        if (this.apiBaseUrl === "/agknow/api/v3") {
          return 3
        }
        if (this.apiBaseUrl === "/agknow/api/v4") {
          return 4
        }
      }
    },
    currentParcelID:  {
      get: function() {
          return this.gcParcelId;
      },
    },
    selectedDate: {
      get: function() {
        // either outer selected date
        if (this.gcSelectedDate.length > 0) {
          if (this.isDateValid(this.gcSelectedDate))
            return this.gcSelectedDate;
        }// or internal selected date
        else {
          if (this.isDateValid(this.internalSelectedDate))
            return this.internalSelectedDate;
        }
      },
      set: function(value) {
        console.debug("selectedDate - setter: "+value);

        if (this.isDateValid(value)) {
          //should set gcSelectedDate from root to the new value
          this.$root.$emit("queryDateChange", value);
          this.internalSelectedDate = value;
        }
      }
    },
    selectedDateStats: {
      get: function() {
        return this.internalSelectedDateStats;
      },
      set: function(value) {
        this.$root.$emit("queryDateStatsChange", value);
      }
    },
    availableOptions: {
      get: function() {
        return (this.gcAvailableOptions.split(","));
      }
    },
    currentLanguage: {
      get: function() {
        // will always reflect prop's value 
        return this.gcLanguage;
      },
    },
    performance: {
      get: function() {
        // calculate performance with ranking & current parcel with NDVI
        if (this.ranking) {
          return this.ranking.map(r => r.ranking.mean);
        }
        else {
          return [];
        }
      }
    },
    crop: {
      get: function() {
        return this.gcCrop;
      }
    },
    entity: {
      get: function() {
        return this.gcEntity;
      }
    }
  },
  i18n: { 
    locale: this.currentLanguage,
    messages: gcPerformanceLocales
  },
  created: function () {
    console.debug("gc-performance! - created()");
    this.changeLanguage();
  },
  /* when vue component is mounted (ready) on DOM node */
  mounted: function () {

    console.debug("gc-performance! - mounted()");

    // listen on size change handler
    this.$root.$on("containerSizeChange", this.containerSizeChange);

    //initial loading data
    if (this.gcParcelId > 0) {
      this.currentParcelID = this.gcParcelId;
      this.handleCurrentParcelIDchange();
    }

    // init datepickers
    if (this.availableOptions.includes('dateSelector')) {
      this.initDatePickers();
    }
  },
  watch: {
    currentParcelID: function (newValue, oldValue) {

      console.debug("event - currentParcelIDChange");

      this.handleCurrentParcelIDchange(newValue, oldValue);
    },
    selectedDate: function (newValue, oldValue) {

      console.debug("event - sdateChange");

      if (this.isDateValid(this.selectedDate)) {
        this.getRanking();
      }
    },
    performance: {
      handler: function (newValue, oldValue) {

        console.debug("event - performanceChange");

        // create chart from values, if they change
        this.createChartData();
      },
      deep: true
    },
    currentLanguage(newValue, oldValue) {
      this.changeLanguage();
      // rebuild chart if language changed, otherwise localization will not refresh
      this.createChartData();
      // reinit date pickers for different language
      this.initDatePickers();
    },
  },
  methods: {
    getApiUrl: function (endpoint) {
      /* handles requests directly against  geocledian endpoints with API keys
          or (if gcProxy is set)
        also requests against the URL of gcProxy prop without API-Key; then
        the proxy or that URL has to add the api key to the requests against geocledian endpoints
      */
      let protocol = 'http';

      if (this.apiSecure) {
        protocol += 's';
      }

      // if (this.apiEncodeParams) {
      //   endpoint = encodeURIComponent(endpoint);
      // }
      
      // with or without apikey depending on gcProxy property
      return (this.gcProxy ? 
                protocol + '://' + this.gcProxy + this.apiBaseUrl + endpoint  : 
                protocol + '://' + this.gcHost + this.apiBaseUrl + endpoint + "?key="+this.apiKey);
    },
    togglePerfchart: function () {
      this.gcWidgetCollapsed = !this.gcWidgetCollapsed;
    },
    containerSizeChange(size) {
      /* handles the resize of the chart if parent container size changes */
      if (this.chart) {
        setTimeout(function(){ 
          this.chart.resize();
        }.bind(this),
        200
        );
      }
    },
    handleCurrentParcelIDchange: function () {

      console.debug("methods - handleCurrentParcelIDchange");

      //only if valid parcel id
      if (this.currentParcelID > 0) {
      
        this.filterDetailData();

        this.getRanking();
      }
    },
    //returns detailed data from REST service by passing the selected parcel_id
    filterDetailData: function () {

      console.debug("methods - filterDetailData");
      
    },
    getCurrentParcel: function () {
      return {parcel_id: this.currentParcelID};
    },
    getRanking: function() {

      this.api_err_msg = "";
      this.watermark_msg = "";
      this.isloading = true;
      //clear chart
      if (this.chart) {
        this.chart.unload();
      }
      this.ranking = undefined;

      const endpoint = "/ranking";
      if (!this.isDateValid(this.selectedDate)) {
        this.isloading = false;
        return;
      }

      let params = "&ranking_date="+ this.selectedDate + "&product=ndvi" + "&crop="+this.crop + "&entity=" +this.entity;
    
      //Show requests on the DEBUG console for developers
      console.debug("getRanking()");
      console.debug("GET " + this.getApiUrl(endpoint) + params);

      axios({
        method: 'GET',
        url: this.getApiUrl(endpoint) + params,
      }).then(function (response) {
        console.debug(response);
        if(response.status === 200){
          try {
            var result  = response.data;
            if (this.apiMajorVersion === 4) {
              this.ranking = result.content;
              console.debug(this.ranking);
              this.getStatisticsSingleDate();
            }
          } catch (err) {
            console.error(err);
            this.api_err_msg = err;
            this.isloading = false;
          }
        } else {
          this.api_err_msg = response.data;
          this.isloading = false;
        }
      }.bind(this)).catch(err => {
        this.api_err_msg = err.response.data;
        this.isloading = false;
      })
    },
    getStatisticsSingleDate: function() {

      const endpoint = "/parcels/" + this.currentParcelID + "/" + "ndvi" + "/";

      if (!this.isDateValid(this.selectedDate)) {
        this.isloading = false;
        return;
      }

      let params = "&source=sentinel2&statistics=true";
    
      //Show requests on the DEBUG console for developers
      console.debug("getRanking()");
      console.debug("GET " + this.getApiUrl(endpoint) + params);

      axios({
        method: 'GET',
        url: this.getApiUrl(endpoint) + params,
      }).then(function (response) {
        console.debug(response);
        if(response.status === 200){
          try {
            var result  = response.data;
            if (this.apiMajorVersion === 4) {
              // result.statistics
              console.debug(result);
              if (result.content.length > 0) {
                let idx = this.getClosestTimeSeriesIndex(result.content, this.selectedDate);
                console.debug(idx);
                console.debug(result.content[idx].statistics);
                this.internalSelectedDateStats = result.content[idx].statistics;
                this.isloading = false;
                this.createChartData();
              }
              else {
                this.isloading = false;
                return;
              }
            }
          } catch (err) {
            console.error(err);
            this.api_err_msg = err;
          }
        } else {
          this.api_err_msg = response.data;
          this.isloading = false;
        }
      }.bind(this)).catch(err => {
        this.api_err_msg = err.response.data;
        this.isloading = false;
      })
    },
    createChartData: function() {

      console.debug("createChartData()");
  
      let columns = [];

      if (this.apiMajorVersion === 4) {
        if (this.performance.length > 0) {
                    
          let median = this.formatDecimal(d3.quantile(this.performance, 0.5),2);
          let min = this.formatDecimal(Math.min(...this.performance),2);
          let max = this.formatDecimal(Math.max(...this.performance),2);
          console.debug(this.selectedDateStats);
          let current = this.formatDecimal(this.selectedDateStats.mean, 2);
          let pct25 = this.formatDecimal(d3.quantile(this.performance, 0.25),2);
          let pct75 = this.formatDecimal(d3.quantile(this.performance, 0.75),2);
          
          // {open:0.43, high:0.8, low:0.3, close:0.65}
          columns[0] = ["data"].concat({open: pct25, high: max, low: min, close: pct75, current:current, median:median});

          this.createChart(columns);
        }
      }

    },
    createChart: function(data) {

      console.debug("createChart()");
      console.debug(data);

      let median = data[0][1]["median"];
      let min = data[0][1]["low"];
      let max = data[0][1]["high"];
      let current = data[0][1]["current"];

      this.chart = bb.generate({
        bindto: '#chart_'+this.gcWidgetId,
        data: {
          columns: data,
          type: "candlestick",
          colors: {
            data: "#EF7D00"
          },
        },
        candlestick: {
          width: {
            data:32,
          },
        },
        axis: {
          x: {
            show: false,
            type: "category"
          },
          rotated: true,
          y: {
            // label: {
            //   text: "NDVI",
            //   position: "outer-right"
            // }
          }
        },
        grid: {
          y: {
            lines: [
              {
                value: min,
                text: "",
                class: "gc-candlestick-min"
              },  
              {
                value: median,
                text: "",
                class: "gc-candlestick-median"
              },
              {
                value: current,
                text: this.$t("description.parcel"),
                class: "gc-candlestick-current"
              },
              {
                value: max,
                text: "",
                class: "gc-candlestick-max"
              },  
            ]
          },
          front: true
        },
        tooltip: {
          contents: function(d, defaultTitleFormat, defaultValueFormat, color) {
            
            if (d[0].value) {
              let html = '<table class="bb-tooltip">' +
              '<tbody>'+
                '<tr><th colspan="2">NDVI</th></tr>';

              // its only one element!
              let open = d[0].value.open;            
              let high = d[0].value.high;
              let low = d[0].value.low;
              let close = d[0].value.close;
              let median = d[0].value.median;
              let current = d[0].value.current;
              let index = d[0].index;
              let name = d[0].name;

              console.debug(open,high,low,close,median,current,index,name);
              let map = {
                "low": "minimum",
                "open": "Q1",
                "median": "median",
                "close": "Q2",
                "high": "maximum",
                "current": this.$t("description.parcel")
              }
              let keys = Object.keys(d[0].value);
              let sortingKeys = Object.keys(map);
              keys = keys.sort(function(a, b){  
                return sortingKeys.indexOf(a) - sortingKeys.indexOf(b);
              });

              for (let i=0;i<keys.length;i++) {
                let key = keys[i];
                // console.debug(key);
                html += '<tr class="'+'bb-tooltip-'+map[key]+'">'+
                '<td class="bb-tooltip"><b>'+ map[key] + ':</b></td>'+
                '<td class="bb-tooltip">'+ d[0].value[key] + '</td></tr>';
                //console.debug(html);
              }
              return html;
            }
          }.bind(this)
        },
        legend: {
          show: false
        },
        transition: {
            duration: 500
        },
      });

    },
    initDatePickers() {

      console.debug("initDatePickers()");
      if (this.inpSdatePicker) {
        this.inpSdatePicker.destroy();
      }

      this.inpSdatePicker = new bulmaCalendar( document.getElementById( 'inpSdate_'+this.gcWidgetId ), {
        startDate: new Date(Date.parse(this.selectedDate)), // Date selected by default
        dateFormat: 'yyyy-mm-dd', // the date format `field` value
        lang: this.currentLanguage, // internationalization
        overlay: false,
        align: "right",
        closeOnOverlayClick: true,
        closeOnSelect: true,
        // callback functions
        onSelect: function (e) { 
                    // hack +1 day - don't know why we need this here - timezone?
                    var a = new Date(e.valueOf() + 1000*3600*24);
                    this.selectedDate = a.toISOString().split("T")[0]; //ISO String splits at T between date and time
                    }.bind(this),
      });
      console.debug(this.inpSdatePicker);
    },
    /* GUI helper */
    changeLanguage() {
      this.$i18n.locale = this.currentLanguage;
    },  
    /* helper functions */
    removeFromArray: function(arry, value) {
      let index = arry.indexOf(value);
      if (index > -1) {
          arry.splice(index, 1);
      }
      return arry;
    },
    formatDecimal: function(decimal, numberOfDecimals) {
      /* Helper function for formatting numbers to given number of decimals */
  
      var factor = 100;
  
      if ( isNaN(parseFloat(decimal)) ) {
          return NaN;
      }
      if (numberOfDecimals == 1) {
          factor = 10;
      }
      if (numberOfDecimals == 2) {
          factor = 100;
      }
      if (numberOfDecimals == 3) {
          factor = 1000;
      }
      if (numberOfDecimals == 4) {
          factor = 10000;
      }
      if (numberOfDecimals == 5) {
          factor = 100000;
      }
      return Math.ceil(decimal * factor)/factor;
    },
    capitalize: function (s) {
      if (typeof s !== 'string') return ''
      return s.charAt(0).toUpperCase() + s.slice(1)
    },
    isDateValid: function (date_str) {
      /* Validates a given date string */
      if (!isNaN(new Date(date_str))) {
          return true;
      }
      else {
          return false;
      }
    },
    getClosestDate: function (arr, queryDate) {
      console.debug("getClosestDate()");
      /* Returns the closest date in a array of dates
         with the sort function */
      let i = arr.sort(function(a, b) {
        var distancea = Math.abs(queryDate - a);
        var distanceb = Math.abs(queryDate - b);
        return distancea - distanceb; // sort a before b when the distance is smaller
      });
      return i[0];
    },
    getClosestTimeSeriesIndex: function (timeseries, queryDate) {
      /* returns the nearest Date to the given parcel_id and query date */
      const exactDate = this.getClosestDate(timeseries.map(d => new Date(d.date)), new Date(queryDate));
      if (exactDate !== undefined) {
        console.debug("closest date of given date "+ queryDate + " is "+ exactDate.simpleDate());
        // find the index of the closest date in timeseries now
        return timeseries.map(d => d.date).indexOf(exactDate.simpleDate());
      }
    },
    loadJSscript: function (url, callback) {
      
      let script = document.createElement("script");  // create a script DOM node
      script.src = gcGetBaseURL() + "/" + url;  // set its src to the provided URL
      script.async = true;
      console.debug(script.src);
      document.body.appendChild(script);  // add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
      script.onload = function () {
        callback();
      };
    },
  },
});