var utils = {
	formatStamp: function format(datestamp) {
		var date = new Date(datestamp)
		  , day = date.getDate() + ''
		  , month = (date.getMonth()+1) + ''
		  , year = date.getFullYear() + ''
		  , hours = date.getHours() + ''
		  , minutes = date.getMinutes() + ''
		  , seconds = date.getSeconds() + ''
		  ;
		day.length == 1 && (day = '0' + day);
		month.length == 1 && (month = '0' + month);
		hours.length == 1 && (hours = '0' + hours);
		minutes.length == 1 && (minutes = '0' + minutes);
		seconds.length == 1 && (seconds = '0' + seconds);
		return {
			datetime: day + '/' + month + '/' + year + ' ' + hours + ':' + minutes +  ':' + seconds
		  , year: year
		  , month: month
		  , day: day
		  , hours: hours
		  , minutes: minutes
		  , seconds: seconds
		};
	}
  , dateExpressions: [ 'today', 'yesterday', 'week', 'lastweek', 'month', 'year', 'all' ]
  , expressionToDate: function expressionToDate(text) {
        if(utils.dateExpressions.indexOf(text) == -1) {
            return;
        }
        var returnDate = new Date();
        returnDate.setHours(0,0,0,0);
        switch (text){
            case 'yesterday':
                returnDate.setDate(returnDate.getDate()-1);
                break;
            case 'week':
                returnDate.setDate(returnDate.getDate() - returnDate.getDay() + 1);
                break;
            case 'lastweek':
                returnDate.setDate(returnDate.getDate() - returnDate.getDay() + 1 - 7);
                break;
            case 'month':
                returnDate.setDate(1);
                break;
            case 'year':
                returnDate.setDate(1);
                returnDate.setMonth(0);
                break;
            case 'all':
                returnDate.setDate(1);
                returnDate.setMonth(0);
                returnDate.setYear(1971);
                break;
        }
        return returnDate;
    }
};

module.exports = utils;