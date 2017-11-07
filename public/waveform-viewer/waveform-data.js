var data_cntr = {file: "cntr.vcd", scale: "1ns", endtime: "150", signal: [
{ "name": "mod_7SEG_tb.segD",  "size": 1, "wave": [["0", "x"], ["15", "1"], ["45", "0"], ["69", "1"], ["117", "0"], ["141", "1"]]}, { "name": "mod_7SEG_tb.DUT.SevenSeg[7:0]",  "size": 8, "wave": [["0", "x"], ["15", "11111100"], ["45", "1100000"], ["69", "11011010"], ["93", "11110010"], ["117", "1100110"], ["141", "10110110"]]}, { "name": "mod_7SEG_tb.DUT.cntovf",  "size": 1, "wave": [["0", "x"], ["15", "0"], ["39", "1"], ["45", "0"], ["63", "1"], ["69", "0"], ["87", "1"], ["93", "0"], ["111", "1"], ["117", "0"], ["135", "1"], ["141", "0"]]}, { "name": "mod_7SEG_tb.rst",  "size": 1, "wave": [["0", "0"], ["12", "1"], ["24", "0"]]}, { "name": "mod_7SEG_tb.DUT.rst",  "size": 1, "wave": [["0", "0"], ["12", "1"], ["24", "0"]]}, { "name": "mod_7SEG_tb.segB",  "size": 1, "wave": [["0", "x"], ["15", "1"], ["141", "0"]]}, { "name": "mod_7SEG_tb.DUT.cnt[1:0]",  "size": 2, "wave": [["0", "x"], ["15", "0"], ["27", "1"], ["33", "10"], ["39", "11"], ["45", "0"], ["51", "1"], ["57", "10"], ["63", "11"], ["69", "0"], ["75", "1"], ["81", "10"], ["87", "11"], ["93", "0"], ["99", "1"], ["105", "10"], ["111", "11"], ["117", "0"], ["123", "1"], ["129", "10"], ["135", "11"], ["141", "0"], ["147", "1"]]}, { "name": "mod_7SEG_tb.DUT.BCD[3:0]",  "size": 4, "wave": [["0", "x"], ["15", "0"], ["45", "1"], ["69", "10"], ["93", "11"], ["117", "100"], ["141", "101"]]}, { "name": "mod_7SEG_tb.segA",  "size": 1, "wave": [["0", "x"], ["15", "1"], ["45", "0"], ["69", "1"], ["117", "0"], ["141", "1"]]}, { "name": "mod_7SEG_tb.segC",  "size": 1, "wave": [["0", "x"], ["15", "1"], ["69", "0"], ["93", "1"]]}, { "name": "mod_7SEG_tb.segDP",  "size": 1, "wave": [["0", "x"], ["15", "0"]]}, { "name": "mod_7SEG_tb.DUT.clk",  "size": 1, "wave": [["0", "0"], ["3", "1"], ["6", "0"], ["9", "1"], ["12", "0"], ["15", "1"], ["18", "0"], ["21", "1"], ["24", "0"], ["27", "1"], ["30", "0"], ["33", "1"], ["36", "0"], ["39", "1"], ["42", "0"], ["45", "1"], ["48", "0"], ["51", "1"], ["54", "0"], ["57", "1"], ["60", "0"], ["63", "1"], ["66", "0"], ["69", "1"], ["72", "0"], ["75", "1"], ["78", "0"], ["81", "1"], ["84", "0"], ["87", "1"], ["90", "0"], ["93", "1"], ["96", "0"], ["99", "1"], ["102", "0"], ["105", "1"], ["108", "0"], ["111", "1"], ["114", "0"], ["117", "1"], ["120", "0"], ["123", "1"], ["126", "0"], ["129", "1"], ["132", "0"], ["135", "1"], ["138", "0"], ["141", "1"], ["144", "0"], ["147", "1"], ["150", "0"]]}, { "name": "mod_7SEG_tb.clk",  "size": 1, "wave": [["0", "0"], ["3", "1"], ["6", "0"], ["9", "1"], ["12", "0"], ["15", "1"], ["18", "0"], ["21", "1"], ["24", "0"], ["27", "1"], ["30", "0"], ["33", "1"], ["36", "0"], ["39", "1"], ["42", "0"], ["45", "1"], ["48", "0"], ["51", "1"], ["54", "0"], ["57", "1"], ["60", "0"], ["63", "1"], ["66", "0"], ["69", "1"], ["72", "0"], ["75", "1"], ["78", "0"], ["81", "1"], ["84", "0"], ["87", "1"], ["90", "0"], ["93", "1"], ["96", "0"], ["99", "1"], ["102", "0"], ["105", "1"], ["108", "0"], ["111", "1"], ["114", "0"], ["117", "1"], ["120", "0"], ["123", "1"], ["126", "0"], ["129", "1"], ["132", "0"], ["135", "1"], ["138", "0"], ["141", "1"], ["144", "0"], ["147", "1"], ["150", "0"]]}, { "name": "mod_7SEG_tb.segE",  "size": 1, "wave": [["0", "x"], ["15", "1"], ["45", "0"], ["69", "1"], ["93", "0"]]}, { "name": "mod_7SEG_tb.segF",  "size": 1, "wave": [["0", "x"], ["15", "1"], ["45", "0"], ["117", "1"]]}, { "name": "mod_7SEG_tb.segG",  "size": 1, "wave": [["0", "x"], ["15", "0"], ["69", "1"]]}]};
var timing = JSON.parse('{"rendered":["mod_7SEG_tb.clk","mod_7SEG_tb.segA","mod_7SEG_tb.segB","mod_7SEG_tb.segC","mod_7SEG_tb.segD","mod_7SEG_tb.segDP","mod_7SEG_tb.rst","mod_7SEG_tb.segE","mod_7SEG_tb.segF","mod_7SEG_tb.DUT.BCD[3:0]"],"hidden":["mod_7SEG_tb.DUT.SevenSeg[7:0]","mod_7SEG_tb.DUT.cntovf","mod_7SEG_tb.DUT.rst","mod_7SEG_tb.DUT.cnt[1:0]","mod_7SEG_tb.DUT.clk","mod_7SEG_tb.segG"],"from":43,"to":69,"cursor":"52.75","cursorExact":52.753017641597026,"end":150,"originalEnd":"150","radix":2,"timeScale":"1","timeScaleUnit":"ns","timeUnit":1000,"highlightedIndex":5}')
var waveform = new Waveform('waveform-container', data_cntr, null)
waveform.setOnChangeListener(function(e){
    console.log(e);
})
