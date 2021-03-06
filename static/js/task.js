//  CONTROL PANEl
var debug = false; // debug mode
var reward = true; // reward mode
var phase1 = true;
var phase2 = true;
var phase3 = true;
var phase31 = true;
var phase32 = true;
var phase4 = true;

/* load psiturk */
if(!debug){
  var psiturk = new PsiTurk(uniqueId, adServerLoc, mode);
}

//The main timeline to be fed into jsPsych.init
var timeline = [];

if(debug){
  condition = 0;
  counterbalance = 2;
}

// reward selection
var reward_input = {
  0: 'repetition',
  1: 'switch'
};

// Setting up counterbalancing conditions
var num_sequences = 16; // number of sequences we want to use

// compute the counterbalance conditions based on counterbalance assignment
var p1_cb, p2_cb;
if(counterbalance < num_sequences / 4){
  p1_cb = 0;
  p2_cb = 0;
}else if(counterbalance < num_sequences / 2){
  p1_cb = 1;
  p2_cb = 0;
}else if(counterbalance < (num_sequences / 4) * 3){
  p1_cb = 0;
  p2_cb = 1;
}else {
  p1_cb = 1;
  p2_cb = 1;
}

// Loading trial data files synchronously
var experiment_sequence = (parseInt(counterbalance) + 1); // compute the sequence number from counterbalance assignment
var practice_sequence = experiment_sequence % num_sequences + 1 // for the practice sequence, select the next sequence number (wraps around)

var manipulation ='reward_miniBlockSize1';
var experiment_url = "/static/trial_data/" + manipulation + "/sequence" + experiment_sequence + ".csv";
var practice_url = "/static/trial_data/" + manipulation + "/sequence" + practice_sequence + ".csv";

// Loading config and trial data files synchronously
var config, headers, lines;

$.ajax({
  url: '/static/js/config.json', // load the config file
  async: false,
  dataType: 'json',
  success: function (response) {
    config = response[0]
  }
});

$.ajax({
    url: practice_url, // load the practice file (phase 3)
    async: false,
    dataType: "text",
    success: function (response) {
      processData(response, 1);
    }
 });

 $.ajax({
     url: experiment_url, // load the test file (phase 4)
     async: false,
     dataType: "text",
     success: function (response) {
       processData(response, 2);
     }
  });

// This function reads into the trial sequence csv files
//    option: 1 = practice (phase 3), 2 = test (phase 4)
//    allText: raw text from csv files loaded above
var prc_lines_1, prc_lines_2, exp_lines_1, exp_lines_2;
function processData(allText, option) {
    var allTextLines = allText.split(/\r\n|\n/);

    // extract the headers into the respective variable
    if(option == 1){
      prc_headers = allTextLines[0].split(',');
      prc_lines_1 = [];
      prc_lines_2 = [];
    }else if(option == 2){
      exp_headers = allTextLines[0].split(',');
      exp_lines_1 = [];
      exp_lines_2 = [];
    }

    // loop through each line (trial) in the sequence
    for (var i=1; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if(option == 1){
          if (data.length == prc_headers.length){
            if(parseInt(data[11]) == 1){ // extract first half of miniblocks
              var tarr = [];
              // loop through the individual elements on each line (trial)
              for (var j=0; j<prc_headers.length; j++) {
                  tarr.push(data[j]);
              }
              prc_lines_1.push(tarr);
            }else if(parseInt(data[11]) == 2){ // extract second half of miniblocks
              var tarr = [];
              // loop through the individual elements on each line (trial)
              for (var j=0; j<prc_headers.length; j++) {
                  tarr.push(data[j]);
              }
              prc_lines_2.push(tarr);
            }
          }
        }else if(option == 2){
          if (data.length == exp_headers.length) {
            if(parseInt(data[11]) == 1){
              var tarr = [];
              // loop through the individual elements on each line (trial)
              for (var j=0; j<exp_headers.length; j++) {
                  tarr.push(data[j]);
              }
              exp_lines_1.push(tarr);
            }else if(parseInt(data[11]) == 2){ // extract second half of miniblocks
              var tarr = [];
              // loop through the individual elements on each line (trial)
              for (var j=0; j<exp_headers.length; j++) {
                  tarr.push(data[j]);
              }
              exp_lines_2.push(tarr);
            }
          }
        }
    }
}

// fullscreen mode
if(!debug){
timeline.push({
  type: 'fullscreen',
  fullscreen_mode: true,
  message: '<p>The experiment will swap to full screen mode when you press the button below</p>',
  button_label: 'Start Experiment'
});
}

function point_probability(type, miniblock_trial){
  var random_num = jsPsych.randomization.sampleWithoutReplacement([1,2,3,4,5], 1)[0];

  if(type == 'high'){
    if(random_num > 1){
      bonus += 0.05;
      return "+5 CENTS!"
    }else{
      bonus += 0.01;
      return "+1 CENT!"
    }
  }else if(type == 'low'){
    if(random_num == 1){
      bonus += 0.05;
      return "+5 CENTS!"
    }else{
      bonus += 0.01;
      return "+1 CENT!"
    }
  }
}

// reward feedback and bonus keeping
function reward_feedback(type, transition, cond, miniblock_trial){
  var output;

  if(type == 'cue'){
    if(transition == '1'){ // switch
      return "TASK SWITCH";
    }else if(transition == '0'){ //repetition
      return "TASK REPETITION"
    }else{
      return '';
    }
  }else if(type == 'fixation'){
    if(transition == '1'){ // switch
      if(cond == 0){ //repetition rewarded more
        output = point_probability('low', miniblock_trial);
      }else if(cond == 1){ // switch rewarded more
        output = point_probability('high', miniblock_trial);
      }
    }else if(transition == '0'){ //repetition
      if(cond == 0){ //repetition rewarded more
        output = point_probability('high', miniblock_trial);
      }else if(cond == 1){ // switch rewarded more
        output = point_probability('low', miniblock_trial);
      }
    }else if(transition == '-1'){
      output = point_probability('low', miniblock_trial);
    }else{
      return "Correct!"
    }
  }

  bonus = Math.round(bonus * 100) / 100
  document.querySelector('#srt-bonus').innerHTML = '$'+ bonus.toString();
  return output;

}

// Generates template for cue stimulus
//    phase: "3.1", "3.2", "4.1", or '4.2'
//    task: "motion" or "color"
//    cue_shape: "circle", "triangle", "diamond", or "square"

var cue = {
  type: 'html-keyboard-response',
  stimulus: '',
  choices: jsPsych.NO_KEYS,

  phase: jsPsych.timelineVariable('phase'),
  task: jsPsych.timelineVariable('task'),
  cue_shape: jsPsych.timelineVariable('cue_shape'),

  trial_duration: config.cue_duration, //Duration of each cue in ms

  data: jsPsych.timelineVariable('data'), //additional data tagged for consistency

  on_start: function(cue){

    if(typeof cue.cue_shape === "undefined"){ //by default, show a circle if no cue shape is inputted
      cue.stimulus = "<div style='float: center;'><img src='/static/images/circle.png'></img></div>";
    }else{
      if(cue.phase == '3.1'){
        cue.stimulus += "<div style='width: 700px;'>" +
           "<div style='float: center;'><img src='/static/images/" + cue.cue_shape + ".png'></img></div>" +
                "(this cues a " + cue.task + " task)</div>"; // extra feedback

        if(reward){
          //cue.stimulus += reward_feedback('cue', cue.data.task_transition, condition, 0)
          cue.trial_duration = cue.trial_duration + 1500;
        }

        cue.trial_duration = cue.trial_duration + 1500; //extend the cue duration if it's still the practice phase

      }else if(cue.phase == '3.2'){
        cue.stimulus = "<div style='width: 700px;'>" +
           "<div style='float: center;'><img src='/static/images/" + cue.cue_shape + ".png'></img></div>";

        if(reward){
           cue.stimulus += reward_feedback('cue', cue.data.task_transition, condition, 0)
           cue.trial_duration = cue.trial_duration + 500;
         }

        cue.trial_duration = cue.trial_duration + 500; //extend the cue duration if it's still the practice phase

      }else{ // phase 4
        cue.stimulus = "<div style='float: center;'><img src='/static/images/" + cue.cue_shape + ".png'></img></div>";
      }
    }
  }
}



// Generates template for fixation stimulus
//    phase: "1.1", "1.2", "3.1", "3.2", "4.1",or "4.2"
//      - changes the amount of feedback based on phase.
var fixation = {
  type: 'html-keyboard-response',
  stimulus: '',
  choices: jsPsych.NO_KEYS,
  trial_duration: config.inter_trial_interval,

  phase: jsPsych.timelineVariable('phase'),
  data: jsPsych.timelineVariable('data'),

  on_start: function(fixation){
    // get data from previous trial
    var data = jsPsych.data.get().last().values()[0];

    // prompt whether the previous trial was correct or not
    if(config.training_feedback){
      if(fixation.phase == '1.1' || fixation.phase == '1.2' || fixation.phase == '3.1'){
        if(typeof data.correct === "undefined"){
          fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
        }else if(data.correct){
          if(reward && fixation.phase == '3.1'){
            fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
            '<div style="color:white;font-size:30px"; class = center-text><b>' +
                reward_feedback('fixation', fixation.data.task_transition, condition, fixation.data.miniblock_trial) + '</b>'+
            '</div><p style="color:grey;">filler</p>';
            fixation.trial_duration = fixation.trial_duration + 500;
          }else if(fixation.phase == '1.1'){
            motionTrials = motionTrials - 1;
            fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
            '<div style="color:white;font-size:30px"; class = center-text><b>Correct</b>'+
            '</div><p style="color:white;">'+ motionTrials +' trials left</p>';
          }else if(fixation.phase == '1.2'){
            colorTrials = colorTrials - 1;
            fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
            '<div style="color:white;font-size:30px"; class = center-text><b>Correct</b>'+
            '</div><p style="color:white;">'+ colorTrials +' trials left</p>';
          }
        }else if(!data.correct){
          if(data.rt == -1){
            if(fixation.phase == '3.1'){
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Too Slow!</b>' +
              "</div><p>Do not wait for the '?', respond as soon as you can.</p>";
            }else if(fixation.phase == '1.1'){
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Too Slow!</b>' +
              "</div><p>Respond as fast as you can when you see the '?'.</p>";
              motionTrials = motionTrials - 1;
            }else if(fixation.phase == '1.2'){
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Too Slow!</b>' +
              "</div><p>Respond as fast as you can when you see the '?'.</p>";
              colorTrials = colorTrials - 1;
            }
          }else if(data.task == 'motion'){
            if(data.correct_choice == 'a'){
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Incorrect</b>' +
              '</div><p>Press A for coherent dots moving UP.</p>';
            }else if(data.correct_choice == 'l'){
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Incorrect</b>' +
              '</div><p>Press L for coherent dots moving DOWN.</p>';
            }
            if(fixation.phase == '1.1'){
              motionTrials = motionTrials - 1;
            }
          }else if(data.task == 'color'){
            if(data.correct_choice == 'a'){
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Incorrect</b>' +
              '</div><p>Press A for mostly blue dots.</p>';
            }else if(data.correct_choice == 'l'){
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Incorrect</b>' +
              '</div><p>Press L for mostly red dots.</p>';
            }
            if(fixation.phase == '1.2'){
              colorTrials = colorTrials - 1;
            }
          }
          fixation.trial_duration = fixation.trial_duration + 2000;
        }else if(config.fixation_cross){
          fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
        }
      }else if(fixation.phase == '3.2'){
        if(typeof data.correct === "undefined"){
          fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
        }else if(data.correct){
          if(reward){
            fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
            '<div style="color:white;font-size:30px"; class = center-text><b>' +
                reward_feedback('fixation', fixation.data.task_transition, condition, fixation.data.miniblock_trial) + '</b>'+
            '</div><p style="color:grey;">filler</p>';
            fixation.trial_duration = fixation.trial_duration + 500;
          }else{
            fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
            '<div style="color:white;font-size:30px"; class = center-text><b>Correct</b>'+
            '</div><p style="color:grey;">Filler</p>';
          }
        }else if(!data.correct){
          if(data.rt == -1){
            fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
            '<div style="color:white;font-size:30px"; class = center-text><b>Too Slow!</b>' +
            "</div><p>Do not wait for the '?', respond as soon as you can.</p>";
          }else if(data.task == 'motion'){
            fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
            '<div style="color:white;font-size:30px"; class = center-text><b>Incorrect</b>' +
            '</div><p>This was a motion task.</p>';
          }else if(data.task == 'color'){
            fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
            '<div style="color:white;font-size:30px"; class = center-text><b>Incorrect</b>' +
            '</div><p>This was a color task.</p>';
          }
          fixation.trial_duration = fixation.trial_duration + 1000;
        }else if(config.fixation_cross){
          fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
        }
      }else if(fixation.phase == '4.1' || fixation.phase == '4.2'){
        if(config.task_feedback){
          if(typeof data.correct === "undefined"){
            fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
          }else if(data.correct){
            fixation.trial_duration = fixation.trial_duration + 300;

            if(reward){
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>' +
                  reward_feedback('fixation', fixation.data.task_transition, condition, fixation.data.miniblock_trial) + '</b>'+
              '</div><p style="color:grey;">filler</p>';
            }else{
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Correct</b>'+
              '</div><p style="color:grey;">Filler</p>';
            }
          }else if(!data.correct){
            fixation.trial_duration = fixation.trial_duration + 300;

            if(data.rt == -1){
              if(reward){
                fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
                '<div style="color:white;font-size:30px"; class = center-text><b>Too Slow!</b></div>' +
                '</div><p style="color:grey;">filler</p>';
              }else{
                fixation.prompt = '<div style="color:white;font-size:30px"; class = center-text><b>Too Slow!</b></div>';
              }
            }else{
              if(reward){
                fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
                '<div style="color:white;font-size:30px"; class = center-text><b>Incorrect</b>'+
                '</div><p style="color:grey;">filler</p>';
              }else{
                fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
                '<div style="color:white;font-size:30px"; class = center-text><b>Incorrect</b>'+
                '</div><p style="color:grey;">Filler</p>';
              }
            }
          }else if(config.fixation_cross){
            fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
          }
        }else{
          if(config.fixation_cross){
            fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
          }else{
            fixation.prompt = '';
          }
        }
      }else{
        if(config.fixation_cross){
          fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
        }else{
          fixation.prompt = '';
        }
      }
    }else{
      if(config.fixation_cross){
        fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
      }else{
        fixation.prompt = '';
      }
    }

    // if(fixation.phase == '3.1' || fixation.phase == '3.2'){
    //   // dynamically change inter_trial_interval
    //   if(config.response_ends_trial && config.fill_ITT && data.correct){
    //     fixation.trial_duration += Math.round(data.trial_duration - data.rt) - 200;
    //   }
    // }else if(fixation.phase == '4.1' || fixation.phase == '4.2'){
    //   // dynamically change inter_trial_interval
    //   if(config.response_ends_trial && config.fill_ITT && data.correct){
    //     fixation.trial_duration += Math.round(data.trial_duration - data.rt);
    //   }
    // }

  }
}

// Generates template for fixation stimulus
//    phase: "1.1", "1.2", "3.1", "3.2", "4.1", or "4.2"
//      - changes the amount of feedback based on phase.
//    task: "motion" or "color"
//    correct_choice: "a" or "l"
//    coherent_direction: 'up' or 'down'
//    coherent_color: 'blue' or 'red'
//    cue_shape: "circle", "triangle", "diamond", or "square"
//    motionCoherence: 0.5 - 1.0 range, percentage of dots moving in coherent direction
//    colorCoherence: 0.5 - 1.0 range, percentage of dots in coherent color
var stimulus = {
  type: "dotmotion",
  RDK_type: 3, //The type of RDK used
  choices: ['a', 'l'], //Choices available to be keyed in by participant

  phase: jsPsych.timelineVariable('phase'),
  task: jsPsych.timelineVariable('task'),
  correct_choice: jsPsych.timelineVariable('correct_choice'),
  coherent_direction: jsPsych.timelineVariable('coherent_direction'),
  coherent_color: jsPsych.timelineVariable('coherent_color'),
  cue_shape: jsPsych.timelineVariable('cue_shape'),
  motionCoherence:  currentMotionCoherence,
  colorCoherence: currentColorCoherence,
  data: jsPsych.timelineVariable('data'),

  number_of_dots: config.number_of_dots, //Total number of dots in the aperture
  trial_duration: jsPsych.timelineVariable('trial_duration'), //Duration of each trial in ms
  dot_timeout: jsPsych.timelineVariable('dot_timeout'), //whether dots are replaced by '?' at some point

  response_ends_trial: config.response_ends_trial, //Whether response ends the trial or not
  fill_ITT: config.fill_ITT, // Whether to standardize trial length or not, condition on response_ends_trial being true
  text: jsPsych.timelineVariable('text'),

  on_start: function(stimulus){
    stimulus.motionCoherence = currentMotionCoherence;
    stimulus.colorCoherence = currentColorCoherence;

    if(stimulus.phase == '3.1' || stimulus.phase == '3.2' || stimulus.phase == '4.1' || stimulus.phase == '4.2'){
      stimulus.data.bonus = bonus;
    }
  },

  on_finish: function(stimulus){
    var data = jsPsych.data.get().last().values()[0];

    if(stimulus.phase == '1.1'){
      // update coherence for staircasing
      if(typeof data.correct === "undefined"){
        currentMotionCoherence = currentMotionCoherence + incorrectDelta;
      }else if(data.correct){
        if(currentMotionCoherence - correctDelta > minMotionCoherence){
          currentMotionCoherence = currentMotionCoherence - correctDelta;
        }else{
          currentMotionCoherence = minMotionCoherence
        }
      }else{
        if(currentMotionCoherence < maxCoherence){
          if(currentMotionCoherence + incorrectDelta >= maxCoherence){
            currentMotionCoherence = maxCoherence;
          }else{
            currentMotionCoherence = currentMotionCoherence + incorrectDelta;
          }
        }
      }
    }else if(stimulus.phase == '1.2'){
      // update coherence for staircasing
      if(typeof data.correct === "undefined"){
        currentColorCoherence = currentColorCoherence + incorrectDelta;
      }else if(data.correct){
        if(currentColorCoherence - correctDelta > minColorCoherence){
          currentColorCoherence = currentColorCoherence - correctDelta;
        }else{
          currentColorCoherence = minColorCoherence
        }
      }else{
        if(currentColorCoherence < maxCoherence){
          if(currentColorCoherence + incorrectDelta >= maxCoherence){
            currentColorCoherence = maxCoherence;
          }else{
            currentColorCoherence = currentColorCoherence + incorrectDelta;
          }
        }
      }
    }

    // if(config.adaptive_trial_duration && stimulus.miniblock_trial == 1 && (stimulus.phase == '3.1' || stimulus.phase == '3.2' || stimulus.phase == '4.1' || stimulus.phase == '4.2')){
    //   var data = jsPsych.data.get().filterCustom(function(x){ return x.trial_type == 'dotmotion' && (x.phase == '3.1' || x.phase == '3.2' || x.phase == '4.1' || x.phase == '4.2') && x.rt != -1; });
    //
    //   var output1 = data.select('rt').mean();
    //   var output2 = data.select('rt').sd();
    //
    //   // set a baseline of 750 and 1500
    //   if(output1 + output2 < 750){
    //     //console.log(output1, output2, 'too low');
    //     currentTrialDuration = 750;
    //   }else if(output1 + output2 > 1250){
    //     //console.log(output1, output2, 'too high');
    //     currentTrialDuration = 1250;
    //   }else{
    //     //console.log(output1, output2);
    //     currentTrialDuration = output1 + output2;
    //   }
    // }

  }
}

var motion_stimulus = [
  {// Motion trial 1
    phase: '1.1',
    task: 'motion',
    correct_choice: 'l', //the correct answer
    coherent_direction: 'down', //the coherent direction
    coherent_color: 'blue' //the correct answer
  },
  {// Motion trial 2
    phase: '1.1',
    task: 'motion',
    correct_choice: 'a', //the correct answer
    coherent_direction: 'up', //the coherent direction
    coherent_color: 'red' //the correct answer
  },{// Motion trial 3
    phase: '1.1',
    task: 'motion',
    correct_choice: 'l', //the correct answer
    coherent_direction: 'down', //the coherent direction
    coherent_color: 'red' //the correct answer
  },
  {// Motion trial 4
    phase: '1.1',
    task: 'motion',
    correct_choice: 'a', //the correct answer
    coherent_direction: 'up', //the coherent direction
    coherent_color: 'blue' //the coherent color
  }
]

var color_stimulus = [
  {// Color trial 1
    phase: '1.2',
    task: 'color',
    correct_choice: 'l',
    coherent_direction: 'down',
    coherent_color: 'red'
  },
  {// Color trial 2
    phase: '1.2',
    task: 'color',
    correct_choice: 'a',
    coherent_direction: 'up',
    coherent_color: 'blue'
  },{// Color trial 3
    phase: '1.2',
    task: 'color',
    correct_choice: 'l',
    coherent_direction: 'up',
    coherent_color: 'red'
  },
  {// Color trial 4
    phase: '1.2',
    task: 'color',
    correct_choice: 'a',
    coherent_direction: 'down',
    coherent_color: 'blue'
  }
]

// --------------------
// FIRST PHASE
// --------------------
//staircasing phase
var numTrials = 100;
var motionTrials = numTrials;
var colorTrials = numTrials;
var currentMotionCoherence = 0.35; // starting coherence
var currentColorCoherence = 0.35; // starting coherence
var incorrectDelta = 0.0566;
var correctDelta = 0.01;
var minMotionCoherence = 0.005;
var minColorCoherence = 0.005;
var maxCoherence = 0.7;

/* define introduction block */
var intro_reward = '';
if(reward){
  intro_reward = "<div style='font-size:24px'>You can earn a <b>bonus payment</b> of $4.00 to $7.50</br>if you respond quickly and accurately.</br>(more details in Phase 3)</div></br>"
}

var introduction = {
  type: 'instructions',
  pages: [
      '<div style="font-size:36px">Welcome to the dot-motion experiment!</div>' +
      '<div align="left"><p>There will be four phases:</p>' +
      '<ul><li><b>Phase 1:</b> you will get to know the color and motion tasks. (20 minutes)</li>' +
      '<li><b>Phase 2:</b> you will learn whether a cue indicates color or motion. (10 minutes)</li>' +
      '<li><b>Phase 3:</b> you will practice swapping between color or motion tasks. (10 minutes)</li>' +
      '<li><b>Phase 4:</b> you will be cued to swap between color or motion tasks. (20 minutes)</p></li></ul></div>' +
      intro_reward + 'The experiment will take approximately 60 minutes to complete.' +
      '<p>Click next to continue.</p>'
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var introduction2 = {
  type: 'instructions',
  pages: [
      "<div style='font-size:32px'>Welcome to the <strong>Phase 1</strong>.</div></br>" +
      "<div style='font-size:24px'>Let's learn about the <u>stimulus</u>.</div>" +
      "<p>A swarm of red and blue dots will be moving on the screen.</p>"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var survey_demographics_gender = {
  type: 'survey-multi-choice',
  preamble: "Before we continue, we need to collect these a few pieces of information about you:",
  questions: [
    {prompt: "What is your gender?", options:  ["Male", "Female", "Other"], required: true, horizontal: false,}
  ],
};


// defining groups of questions that will go together.
var survey_demographics_age = {
  type: 'survey-text',
  questions: [{prompt: "How old are you?"},],
  preamble: "Before we continue, we need to collect these a few pieces of information about you:",
};

var stim_example = {
  timeline: [stimulus],
  timeline_variables: [{
    task: 'motion',
    correct_choice: 'l',
    coherent_direction: 'down',
    coherent_color: 'blue',
    trial_duration: 3000
  }],
}

/* define instructions block */
var instructions_mc = {
  type: 'instructions',
  pages: ["<p>Now that you've seen the stimulus, there are two sets of tasks:</p>"+
          "<div style='font-size:24px'><strong><u>Motion</u></strong> tasks and <strong><u>Color</u></strong> tasks </div>"],
  show_clickable_nav: true,
  post_trial_gap: 1000
};


/* define instructions block */
var instructions_motion = {
  type: 'instructions',
  pages: ["<div style='font-size:32px'>Motion Instructions</div>" +
      "<p>In the <strong>motion</strong> task, there will be two kinds of moving colored dots:</br></br>" +
      "1. <b><u>'Random'</u></b> dots move in <u>random directions</u>.</br>2. <b><u>'Coherent'</u></b> dots move either <u>UP</u> or <u>DOWN</u>. </br>" +
      "<p style='font-size:24px'> <b>The task <font color='#FA8072'>is to figure out whether the </font>coherent dots <font color='#FA8072'>are going</font> UP or DOWN.</b></p>",
      "If the <u>coherent</u> dots are moving <strong>upward</strong>,</br>" +
        "press the <u>A key</u>.</br></br><img src='/static/images/up.gif'></img>" +
        "</br><strong>Press A for coherent dots moving UP</strong>",
      "If the <u>coherent</u> dots are going <strong>downward</strong>,</br>"+
        "press the <u>L key</u>.</br></br><img src='/static/images/down.gif'></img>" +
        "</br><strong>Press L for coherent dots moving DOWN</strong>",

      "<div style='font-size:32px'>Motion Instructions Summary</div>" +
      "<p>In the <strong>motion</strong> task, there will be two kinds of moving colored dots:</br></br>" +
      "1. <b><u>'Random'</u></b> dots move in <u>random directions</u>.</br>2. <b><u>'Coherent'</u></b> dots move either <u>UP</u> or <u>DOWN</u>. </br>" +
      "<p style='font-size:24px'> <b>The task <font color='#FA8072'>is to figure out whether the </font>coherent dots <font color='#FA8072'>are going</font> UP or DOWN.</b></p>" +
      "<div class='row'>" +
        "<div class='column' style='float:center; border-style: solid; border-right: 0;'>If coherent dots are going <strong>UP</strong>,</br>" +
        "press the <u>A key</u>.</br></br><img src='/static/images/up.gif'></img>" +
        "</br><strong>Press A for coherent dots moving UP</strong></div>" +
        "<div class='column' style='float:center; border-style: solid;'>If coherent dots are going <strong>DOWN</strong>,</br>"+
        "press the <u>L key</u>.</br></br><img src='/static/images/down.gif'></img>" +
        "</br><strong>Press L for coherent dots moving DOWN</strong></div>" +
      "</div></br>Press next for an example of each."],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_color = {
  type: 'instructions',
  pages: ["<div style='font-size:32px'>Color Instructions</div>" +
  "<p>In the <strong>color</strong> task, there will be moving colored dots.</p>" +
  "<p style='font-size:24px'><font color='#FA8072'><b>The task</font><font color='#FA8072'> is to figure out whether the dots are </font>mostly <u>BLUE or RED</u>.</b></p>",
      "If most of the dots are <strong>blue</strong>,</br>" +
        "press the <u>A key</u>.</br></br><img src='/static/images/blue.gif'></img>" +
        "</br><strong>Press A for mostly blue</strong>",
      "If most of the dots are <strong>red</strong>,</br>"+
        "press the <u>L key</u>.</br></br><img src='/static/images/red.gif'></img>" +
        "</br><strong>Press L for mostly red</strong>",
    "<div style='font-size:32px'>Color Instructions Summary</div>" +
    "<p>In the <strong>color</strong> task, there will be moving colored dots.</p>" +
    "<p style='font-size:24px'><font color='#FA8072'><b>The task</font><font color='#FA8072'> is to figure out whether the dots are </font>mostly <u>BLUE or RED</u>.</b></p>" +
      "<div class='row'>" +
        "<div class='column' style='float:center; border-style: solid; border-right: 0;'>If most of the dots are <strong>blue</strong>,</br>" +
        "press the <u>A key</u>.</br></br><img src='/static/images/blue.gif'></img>" +
        "</br><strong>Press A for mostly blue</strong></div>" +
        "<div class='column' style='float:center; border-style: solid;'>If most of the dots are <strong>red</strong>,</br>"+
        "press the <u>L key</u>.</br></br><img src='/static/images/red.gif'></img>" +
        "</br><strong>Press L for mostly red</strong></div>" +
      "</div></br>Press next for an example of each."],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_block = {
  type: 'instructions',
  pages: ["<div style='font-size:32px'>Block Instructions</div></br>" +
      "You will now get a series of trials called 'blocks', for both motion and color tasks.</br></br>" +
      "The dots are going to show up for 1.5 seconds and then disappear</br>" +
      "and be replaced by a '?'. You can only respond when you see the '?'.</br></br>" +
      "You only have about 1 second to respond on each trial.</br></br>"+
      "Press next to see the instructions for the motion or color block!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_motion_block = {
  type: 'instructions',
  pages: ["<div style='font-size:32px'>Motion Block</div>" +
      "<p style='font-size:24px'>In this block, you will focus on MOTION.</p>" +
      "There will be around "+numTrials+" motion tasks.</br></br>" +
      "As you get more trials correct, they will get harder. Try to reach</br>" +
      "your highest performance level and stay at that for a while.</br></br>" +
      "Remember:</br></br>"+
      "You can only respond when you see the '?'.</br></br>" +
      "A key = coherent dots UP </br>" +
      "L key = coherent dots DOWN </br></br>" +
      "Press next to begin the motion block!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_color_block = {
  type: 'instructions',
  pages: ["<div style='font-size:32px'>Color Block</div>" +
      "<p style='font-size:24px'>In this block, you will focus on COLOR.</p>" +
      "There will be around "+numTrials+" color tasks.</br></br>" +
      "As you get more trials correct, they will get harder. Try to reach</br>" +
      "your highest performance level and stay at that for a while.</br></br>" +
      "Remember:</br></br>"+
      "You can only respond when you see the '?'.</br></br>" +
      "A key = mostly BLUE </br>" +
      "L key = mostly RED </br></br>" +
      "Press next to begin the COLOR block!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var down_example = {
  timeline: [stimulus],
  timeline_variables: [{
    task: 'motion',
    correct_choice: 'l',
    coherent_direction: 'down',
    coherent_color: 'blue',
    text: 'Coherent Dots Down (Press L)',
    trial_duration: 3000
  }],
}
var up_example = {
  timeline: [stimulus],
  timeline_variables: [{
    task: 'motion',
    correct_choice: 'a',
    coherent_direction: 'up',
    coherent_color: 'blue',
    text: 'Coherent Dots Up (Press A)',
    trial_duration: 3000
  }],
}
var red_example = {
  timeline: [stimulus],
  timeline_variables: [{
    task: 'color',
    correct_choice: 'l',
    coherent_direction: 'down',
    coherent_color: 'red',
    text: 'Mostly Red (Press L)',
    trial_duration: 3000
  }],
}
var blue_example = {
  timeline: [stimulus],
  timeline_variables: [{
    task: 'color',
    correct_choice: 'a',
    coherent_direction: 'down',
    coherent_color: 'blue',
    text: 'Mostly Blue (Press A)',
    trial_duration: 3000
  }],
}

// change the timing of these practice trials
var motion_stimulus_stc = motion_stimulus;
var color_stimulus_stc = color_stimulus;
for(i = 0; i < motion_stimulus.length; i++){
  motion_stimulus_stc[i]['trial_duration'] = 3000;
  motion_stimulus_stc[i]['dot_timeout'] = 1500;
  color_stimulus_stc[i]['trial_duration'] = 3000;
  color_stimulus_stc[i]['dot_timeout'] = 1500;
}

// counterbalance showing motion or color first
if(p1_cb % 2 == 0 && phase1){
  timeline.push(introduction);
  timeline.push(survey_demographics_gender);
  timeline.push(survey_demographics_age);
  timeline.push(introduction2);
  timeline.push(stim_example);
  timeline.push(instructions_mc);
  timeline.push(instructions_motion);
  timeline.push(down_example);
  timeline.push(up_example);
  timeline.push(down_example);
  timeline.push(up_example);

  timeline.push(instructions_color);
  timeline.push(red_example);
  timeline.push(blue_example);
  timeline.push(red_example);
  timeline.push(blue_example);

  timeline.push(instructions_block);


  timeline.push(instructions_motion_block);

  for(i = 0; i < numTrials; i++){
    var stim_sequence = {
      timeline: [stimulus, fixation],
      timeline_variables: motion_stimulus_stc,
      randomize_order: true,
      repetitions: 1,
      sample: {
          type: "without-replacement",
          size: 1
        }
      }
    timeline.push(stim_sequence);
  }

  timeline.push(instructions_color_block);

  for(i = 0; i < numTrials; i++){
    var stim_sequence = {
      timeline: [stimulus, fixation],
      timeline_variables: color_stimulus_stc,
      randomize_order: true,
      repetitions: 1,
      sample: {
          type: "without-replacement",
          size: 1,
              }
      }
    timeline.push(stim_sequence);
  }
}else if(p1_cb % 2 == 1 && phase1){
  timeline.push(introduction);
  timeline.push(survey_demographics_gender);
  timeline.push(survey_demographics_age);
  timeline.push(introduction2);
  timeline.push(stim_example);
  timeline.push(instructions_mc);
  timeline.push(instructions_color);
  timeline.push(red_example);
  timeline.push(blue_example);
  timeline.push(red_example);
  timeline.push(blue_example);

  timeline.push(instructions_motion);
  timeline.push(down_example);
  timeline.push(up_example);
  timeline.push(down_example);
  timeline.push(up_example);

  timeline.push(instructions_block);


  timeline.push(instructions_color_block);

  for(i = 0; i < numTrials; i++){
    var stim_sequence = {
      timeline: [stimulus, fixation],
      timeline_variables: color_stimulus_stc,
      randomize_order: true,
      repetitions: 1,
      sample: {
          type: "without-replacement",
          size: 1,
              }
      }
    timeline.push(stim_sequence);
  }

  timeline.push(instructions_motion_block);

  for(i = 0; i < numTrials; i++){
    var stim_sequence = {
      timeline: [stimulus, fixation],
      timeline_variables: motion_stimulus_stc,
      randomize_order: true,
      repetitions: 1,
      sample: {
          type: "without-replacement",
          size: 1
        }
      }
    timeline.push(stim_sequence);
  }
}

// --------------------
// SECOND PHASE
// --------------------
var trial_counter = 0;
if (trial_counter == 0) {var sum = 0;}
var response_array = [];
var end_phase = false;
var maxTrials = 100;

var shapes = [["circle","triangle"],["diamond","square"]];

if(p2_cb % 2 == 0){
  shapes = shapes.reverse();
}
var mapping = {
  1: shapes[0][0],
  2: shapes[0][1],
  3: shapes[1][0],
  4: shapes[1][1]
};

var instructions_cue = {
  type: 'instructions',
  pages: [
      '<div style="font-size:32px">Welcome to the <strong>Phase 2</strong>. </div></br>'+
      '<div style="font-size:24px">Now, we will add a set of <b>cues</b>. The four cues are: </br>'+
      '(1) circle, (2) triangle, (3) diamond, and (4) square.</div></br>' +
      'The cues will appear before each of the two tasks (motion and color).</br>'+
      'They will indicate <b>which task you are performing</b>.</br></br>' +
      'Click next for a visual example.'
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

/* define instructions block */
var instructions_cue_motion = {
  type: 'instructions',
  pages: [
    "<p>To cue the <strong>motion</strong> task, you will be shown one of the two cues below.</p>" +
        "<div class='row'><div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[1]+" cues motion task</br>(UP or DOWN?)</strong></p></div>" +
        "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[2]+" cues motion task</br>(UP or DOWN?)</strong></p></div></div>" +
      "</br>In other words, after you see one of these cues,</br>you will decide whether the majority of dots are going UP or DOWN."
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};
var instructions_cue_color = {
  type: 'instructions',
  pages: [
    "<p>To cue the <strong>color</strong> task, you will be shown one of the two cues below.</p>" +
        "<div class='row'><div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[3]+" cues color task</br>(RED or BLUE?)</strong></p></div>" +
        "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[4]+" cues color task</br>(RED or BLUE?)</strong></p></div></div>" +
      "</br>In other words, after you see one of these cues,</br>you will decide whether the majority of dots are RED or BLUE."
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};
var instructions_cue2 = {
  type: 'instructions',
  pages: [
      "<div style='font-size:24px'>You will now be tested on how well you know the cues!</div></br>" +
      "You will see one of the cues in the middle of the screen</br>" +
      "with the words 'motion task' and 'color task' on either side of it.</br><hr>" +
      "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>Motion Trial (left)</strong></p></div>" +
      "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>Color Trial (right)</strong></p></div>" +
       "</div>" +
       "<div>" +
          "<div style='float: center;'><img src='/static/images/square.png'></img></div>" +
       "</div>" +
      "<hr>You will have to respond by pressing either the</br> <b><u>left</u></b> arrow key (&larr;)</br> or </br><b><u>right</u></b> arrow key (&rarr;)</br>" +
      "depending on which task type the cue is associated with.</br>",
      "Be sure to pay attention!</br></br>" +
      "Depending on the trial, the location of 'motion task' and 'color task' may <b><u>switch</u></b>.</br><hr>" +
      "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>Color Trial (left arrow)</strong></p></div>" +
      "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>Motion Trial (right arrow)</strong></p></div>" +
             "</div>" +
             "<div>" +
                "<div style='float: center;'><img src='/static/images/square.png'></img></div>" +
             "</div><hr>",
       "If you pick the <font color='#3CB371'>right task</font>, it will turn <font color='#3CB371'>green</font>.</br><hr>" +
       "<div class='column' style='border:3px solid green'>" +
                 "<p class='small'><strong>Motion Trial (left arrow)</strong></p></div>" +
        "<div class='column' style='border:3px solid grey'>" +
                 "<p class='small'><strong>Color Trial (right arrow)</strong></p></div>" +
              "</div>" +
              "<div>" +
                 "<div style='float: center;'><img src='/static/images/square.png'></img></div>" +
              "</div><hr>"+
              "<font color='grey'>Click next to review the cues before we begin the practice round.</font>",
        "If you pick the <font color='red'>wrong</font> task, it will turn <font color='red'>red</font>.</br><hr>" +
        "<div class='column' style='border:3px solid grey'>" +
                  "<p class='small'><strong>Color Trial (left arrow)</strong></p></div>" +
        "<div class='column' style='border:3px solid red'>" +
                  "<p class='small'><strong>Motion Trial (right arrow)</strong></p></div>" +
               "</div>" +
               "<div>" +
                  "<div style='float: center;'><img src='/static/images/square.png'></img></div>" +
               "</div><hr>"+
      "Click next to review the cues before we begin the practice round.",
    "<div style='font-size:24px'>Let's practice associating cues and their tasks.</div>" +
        "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
      "</div>" +
      "<div class='row'>"+
        "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
        "<p class='small'><strong>COLOR task</br></strong></p></div>" +
        "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
        "<p class='small'><strong>COLOR task</br></strong></p></div>" +
      "</div></br>" +
      "Whenever you're ready, place your fingers on the left and right arrow keys and press next!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_cue3 = {
  type: 'instructions',
  pages: [
    "Now that you've gotten a chance to practice, you have to do the same task without any hints.</br></br>" +
    "In order to move on, you will need to get 18 out of the last 20 trials correct.</br>" +
    "To move on, you have to <b><u>memorize</u></b> whether a cue corresponds to motion or color!</br></br>"+
    "Click next to review the cues again. Please memorize them!",
  "<div style='font-size:24px'>Try your best to memorize these cues and their tasks.</div>" +
      "<div class='row'>"+
        "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
        "<p class='small'><strong>MOTION task</br></strong></p></div>" +
        "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
        "<p class='small'><strong>MOTION task</br></strong></p></div>" +
      "</div>" +
      "<div class='row'>"+
        "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
        "<p class='small'><strong>COLOR task</br></strong></p></div>" +
        "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
        "<p class='small'><strong>COLOR task</br></strong></p></div>" +
      "</div>" +
    "Please ready your fingers on the left and right arrow keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var cue_phase = {
  type: "html-keyboard-response",
  stimulus: '',
  choices: [37, 39],
  data: jsPsych.timelineVariable('data'),
  trial_duration: config.trial_duration + 1000,

  on_start: function(cue_phase){
    if(cue_phase.data.practice){
      cue_phase.trial_duration = cue_phase.trial_duration + 3000;
    }

    cue_phase.stimulus = generateCue(cue_phase.data.cue, cue_phase.data.swap, cue_phase.data.practice, cue_phase.data.correct_choice);
  },

  on_finish: function(data){
    if(data.key_press == null){
      data.correct == null;
    }else{
      data.correct = data.key_press == data.correct_choice;
    }
  }

}

var cue_response = {
  type: "html-keyboard-response",
  stimulus: '',
  choices: jsPsych.NO_KEYS,
  data: jsPsych.timelineVariable('data'),
  trial_duration: config.feedback_duration + 300, //Duration of each cue in ms

  on_start: function(cue_response){
    // get data from previous trial
    var prev_trial_data = jsPsych.data.get().last(1).values()[0];

    if(cue_response.data.practice){
      cue_response.trial_duration = cue_response.trial_duration + 2000;
    }else{
      trial_counter += 1;
      if(prev_trial_data.correct){
        response_array.push(1);
      }else{
        response_array.push(0);
      }

      if(response_array.length >= 20){ // start checking at 20 trials
        var temp = response_array.slice(trial_counter - 20);
        sum = temp.reduce(function(pv, cv) { return pv + cv; }, 0);
        if(sum >= 18 || trial_counter >= maxTrials){
          end_phase = true;
        }
      }else{
        sum = response_array.reduce(function(pv, cv) { return pv + cv; }, 0);
      }

      //every fifth trial, give them time to read number of trials left
      if(trial_counter % 5 == 0){
        cue_response.trial_duration = cue_response.trial_duration + 2250;
      }
    }

    cue_response.stimulus = generateCue(cue_response.data.cue, cue_response.data.swap, cue_response.data.practice, prev_trial_data.key_press, prev_trial_data.correct, trial_counter);
  }
}

var cue_fixation = {
  type: 'html-keyboard-response',
  stimulus: '<div style="float: center; font-size:60px; color:black;">+</div>',
  choices: jsPsych.NO_KEYS,
  trial_duration: config.inter_trial_interval
}

function generateCue(cue, swap, practice = false, answer = '', correct = true, trial_counter = -1){
  var response;
  var task = ['Motion','Color'];
  if(swap){
    task = task.reverse();
  }

  var key;
  if(practice){
    if(answer == 37 && correct){
      key = 'left arrow key'
    }else if(answer == 39 && correct){
      key = 'right arrow key'
    }else if(answer == 37 && ~correct){
      key = 'right arrow key'
    }else if(answer == 39 && !correct){
      key = 'left arrow key'
    }
  }

  //trial_counter -1 indicates cue_phase
  if(trial_counter == -1){answer = ''}

  if(answer == null){ // no response, respond faster
    response = "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>" + task[0] + " Trial (&larr;)</strong></p></div>" +
              "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>(&rarr;) " + task[1] + " Trial</strong></p></div>" +
           "</div>" +
           "<div style='height: 158.667px'>" +
              "<div style='justify-content: center; display: flex; font-size:30px;" +
              "height: 158.667px; align-items: center;'>Respond Faster!</div>" +
           "</div>"

  }else if(answer == 37){ // left arrow key
    if(correct){
      response = "<div class='column' style='border:3px solid green'>" +
                "<p class='small'><strong>" + task[0] + " Trial (&larr;)</strong></p></div>" +
                "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>(&rarr;) " + task[1] + " Trial</strong></p></div>" +
             "</div>" +
             "<div>" +
                "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
             "</div>"
    }else{
      response = "<div class='column' style='border:3px solid red'>" +
                "<p class='small'><strong>" + task[0] + " Trial (&larr;)</strong></p></div>" +
                "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>(&rarr;) " + task[1] + " Trial</strong></p></div>" +
             "</div>" +
             "<div>" +
                "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
             "</div>"
    }

  }else if(answer == 39){
    if(correct){
      response = "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>" + task[0] + " Trial (&larr;)</strong></p></div>" +
                "<div class='column' style='border:3px solid green'>" +
                "<p class='small'><strong>(&rarr;) " + task[1] + " Trial</strong></p></div>" +
             "</div>" +
             "<div>" +
                "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
             "</div>"
    }else{
      response = "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>" + task[0] + " Trial (&larr;)</strong></p></div>" +
                "<div class='column' style='border:3px solid red'>" +
                "<p class='small'><strong>(&rarr;) " + task[1] + " Trial</strong></p></div>" +
             "</div>" +
             "<div>" +
                "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
             "</div>"
    }
  }else{
    response = "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>" + task[0] + " Trial (&larr;)</strong></p></div>" +
              "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>(&rarr;) " + task[1] + " Trial</strong></p></div>" +
           "</div>" +
           "<div>" +
              "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
           "</div>"
  }

  filler = "<div style='width: 700px; height: 100px;'>" +
              "<div style='float: center; color: grey'>Filler</div>" +
           "</div>";

  if(practice){
    if(answer == null){
        if(cue == mapping[1] || cue == mapping[2]){
                  return "<div style='color:white'; class='row'>The "+ mapping[1] +" cues a motion trial.</div><div class='row'>" + response + filler;
        }else if(cue == mapping[3] || cue == mapping[4]){
                  return "<div style='color:white'; class='row'>The "+ mapping[1] +" cues a color trial.</div><div class='row'>" + response + filler;
        }
    }else if(cue == mapping[1]){
      return "<div style='color:white'; class='row'>The "+ mapping[1] +" cues a motion trial (press the "+key+").</div><div class='row'>" + response + filler;
    }else if(cue == mapping[2]){
      return "<div style='color:white'; class='row'>The "+ mapping[2] +" cues a motion trial (press the "+key+").</div><div class='row'>" + response + filler;
    }else if(cue == mapping[3]){
      return "<div style='color:white'; class='row'>The "+ mapping[3] +" cues a color trial (press the "+key+").</div><div class='row'>" + response + filler;
    }else if(cue == mapping[4]){
      return "<div style='color:white'; class='row'>The "+ mapping[4] +" cues a color trial (press the "+key+").</div><div class='row'>" + response + filler;
    }
  }else{
    if(trial_counter % 5 == 0){ //answer != null &&
      return "<div class='row'>" +
             "You need at least "+ (18-sum) + " more correct trials to move on!</div>"+
             "<div class='row'>" + response + filler;
    }else{
      return "<div style='color:grey'; class='row'>-</div><div class='row'>" + response + filler;
    }
  }


}

var cue_stimuli_practice = [
  { data: {correct_choice: 37, task: 'motion', cue: mapping[1], practice: true, swap: false}},
  { data: {correct_choice: 37, task: 'motion', cue: mapping[2], practice: true, swap: false}},
  { data: {correct_choice: 39, task: 'color', cue: mapping[3], practice: true, swap: false}},
  { data: {correct_choice: 39, task: 'color', cue: mapping[4], practice: true, swap: false}},
  { data: {correct_choice: 39, task: 'motion', cue: mapping[1], practice: true, swap: true}},
  { data: {correct_choice: 39, task: 'motion', cue: mapping[2], practice: true, swap: true}},
  { data: {correct_choice: 37, task: 'color', cue: mapping[3], practice: true, swap: true}},
  { data: {correct_choice: 37, task: 'color', cue: mapping[4], practice: true, swap: true}}
];

var cue_stimuli = [
  { data: {correct_choice: 37, task: 'motion', cue: mapping[1], practice: false, swap: false}},
  { data: {correct_choice: 37, task: 'motion', cue: mapping[2], practice: false, swap: false}},
  { data: {correct_choice: 39, task: 'color', cue: mapping[3], practice: false, swap: false}},
  { data: {correct_choice: 39, task: 'color', cue: mapping[4], practice: false, swap: false}},
  { data: {correct_choice: 39, task: 'motion', cue: mapping[1], practice: false, swap: true}},
  { data: {correct_choice: 39, task: 'motion', cue: mapping[2], practice: false, swap: true}},
  { data: {correct_choice: 37, task: 'color', cue: mapping[3], practice: false, swap: true}},
  { data: {correct_choice: 37, task: 'color', cue: mapping[4], practice: false, swap: true}}
];

var cue_practice = {
  timeline: [cue_phase, cue_response, cue_fixation],
  timeline_variables: cue_stimuli_practice,
  randomize_order: true,
  repetitions: 1,
  sample: {
      type: "without-replacement",
      size: 8
    }
  }

var cue_sequence = {
  timeline: [cue_phase, cue_response, cue_fixation],
  timeline_variables: cue_stimuli,
  randomize_order: true,
  repetitions: 1,
  sample: {
      type: "without-replacement",
      size: 1
    },
  loop_function: function(data){ // loop until 90% of last 20 trials are correct
      if(end_phase){
          return false;
      }else{
          return true;
      }
    }
  }

if(phase2){
  timeline.push(instructions_cue);
  timeline.push(cue, stimulus);
  if(parseInt(counterbalance) % 2 == 0){
    timeline.push(instructions_cue_motion);
    timeline.push(instructions_cue_color);
  }else{
    timeline.push(instructions_cue_color);
    timeline.push(instructions_cue_motion);
  }
  timeline.push(instructions_cue2);
  timeline.push(cue_practice);
  timeline.push(instructions_cue3);
  timeline.push(cue_sequence);
}

// --------------------
// THIRD PHASE
// --------------------
var instructions_prc = {
  type: 'instructions',
  pages: [
    '<div style="font-size:32px">Welcome to the <strong>Phase 3</strong>. </div></br>'+
    '<div style="font-size:24px">We will be swapping between color and motion tasks.</div></br>' +
    'The cues you learned earlier will tell you if you </br>'+
    'are supposed to focus on color or motion.</br></br>' +
    'Note: there are approximately 30 minutes left in the experiment from this point.</br></br>',

    '<div style="font-size:24px">Here is what the sequence will look like:</div></br>' +
    "<img src='/static/images/sequence_single.PNG'></img>"
  ],
  show_clickable_nav: true
};

var instructions_prc_m = {
  type: 'instructions',
  pages: [
    '<div style="font-size:24px">We will now focus on the <u>motion</u> cues.</div></br>' +
    'You will see a motion cue (' + mapping[1] + ' or ' + mapping[2] + ')'+
    ' and then complete a motion task.</br></br>' +
    "<b>Remember:</b></br>" +
    "We're coming back to 'A' or 'L' responses.</br>" +
    'A is for coherent dots moving UP.</br>' +
    'L is for coherent dots moving DOWN.</br></br>' +
    "<b>Also:</b>"+
    "<font color='#FA8072'><b><h3>You'll no longer be waiting for the '?'</b></br>Respond as soon as you know the answer.</h3></font>"+
    'Click next for an example motion cue + trial.'
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var practice_example1 = {
  timeline: [cue,fixation,stimulus,fixation],
  timeline_variables: [{
    task: 'motion',
    correct_choice: 'l',
    coherent_direction: 'down',
    coherent_color: 'blue',
    text: 'Motion Task - Down (Press L)',
    trial_duration: 4000,
    cue_shape: mapping[1],
    phase: '3.1',
    data: [{task_transition: '-1'}]
  }],
}

var practice_example2 = {
  timeline: [cue,fixation,stimulus,fixation],
  timeline_variables: [{
    task: 'motion',
    correct_choice: 'a',
    coherent_direction: 'up',
    coherent_color: 'blue',
    text: 'Motion Task - Up (Press A)',
    trial_duration: 4000,
    cue_shape: mapping[2],
    phase: '3.1',
    data: [{task_transition: '-1'}]
  }],
}

var practice_example3 = {
  timeline: [cue,fixation,stimulus,fixation],
  timeline_variables: [{
    task: 'motion',
    correct_choice: 'l',
    coherent_direction: 'down',
    coherent_color: 'red',
    text: 'Motion Task - Down (Press L)',
    trial_duration: 4000,
    cue_shape: mapping[1],
    phase: '3.1',
    data: [{task_transition: '-1'}]
  }],
}

var instructions_prc_c = {
  type: 'instructions',
  pages: [
    '<div style="font-size:24px">We will now focus on the <u>color</u> cues.</div></br>' +
    'You will see a color cue (' + mapping[3] + ' or ' + mapping[4] + ')' +
    ' and then complete a color task.</br></br>' +
    "<b>Remember:</b></br>" +
    "We're coming back to 'A' or 'L' responses.</br>" +
    'A is for majority blue dots.</br>' +
    'L is for majority red dots.</br></br>' +
    "<b>Also:</b></br>"+
    "<font color='#FA8072'><b><h3>You'll no longer be waiting for the '?'</b></br>Respond as soon as you know the answer.</h3></font>"+
    'Click next for an color cue + trial.'
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
}

var practice_example4 = {
  timeline: [cue,fixation,stimulus,fixation],
  timeline_variables: [{
    task: 'color',
    correct_choice: 'a',
    coherent_direction: 'down',
    coherent_color: 'blue',
    text: 'Color Task - Blue (Press A)',
    trial_duration: 4000,
    cue_shape: mapping[3],
    phase: '3.1',
    data: [{task_transition: '-1'}]
  }],
}

var practice_example5 = {
  timeline: [cue,fixation,stimulus,fixation],
  timeline_variables: [{
    task: 'color',
    correct_choice: 'l',
    coherent_direction: 'down',
    coherent_color: 'red',
    text: 'Color Task - Red (Press L)',
    trial_duration: 4000,
    cue_shape: mapping[4],
    phase: '3.1',
    data: [{task_transition: '-1'}]
  }],
}

var practice_example6 = {
  timeline: [cue,fixation, stimulus,fixation],
  timeline_variables: [{
    task: 'color',
    correct_choice: 'a',
    coherent_direction: 'up',
    coherent_color: 'blue',
    text: 'Color Task - Blue (Press A)',
    trial_duration: 4000,
    cue_shape: mapping[3],
    phase: '3.1',
    data: [{task_transition: '-1'}]
  }],
}

var reward_instructions_prc2 = {
  type: 'instructions',
  pages: [
    "<div style='font-size:32px'>Fantastic! Now you'll start the practice blocks.</div></br>" +
    "You will have a block of trials just like Phase 1, but now we will add cues </br>"+
    "before each trial, to indicate the current task to be performed.</br></br>" +
    "Click next to learn about bonus payments."
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};


var reward_instructions_prc2_miniblock = {
  type: 'instructions',
  pages: [

    "<div style='font-size:36px'>Fantastic! Now you'll start the practice blocks.</div></br></br>" +
    "<div style='font-size:24px'>" +
    "Just like in Phase 1, you will have a block of trials, but now</br>"+
    "we will add the <u>four cues</u> (square, diamond, triangle, circle).</br></br>"+
    "Press next for important instructions!",
    "<div style='font-size:24px'>" +
    "In a <u>mini-block</u>, you will see a cue followed by a number of trials.</br></br>" +
    "<img src='/static/images/miniblock_color_" + mapping[3] + ".PNG'></img></br>" +
    "The cue indicates the task (color or motion) that you should be doing for all the trials.</div>",

    "<div style='font-size:24px'>" +
    'Do the same task for all the subsequent trials until you get a new cue.</br></br>'+
    "<img src='/static/images/miniblock2_color_" + mapping[3] + ".PNG'></img></br>" +
    "Sometimes, the task will change from color to motion (or vice versa).</br></br>" +
    "This is called a <u>switch</u>.</div></br>",

    "<div style='font-size:24px'>" +
    'Other times, the task will stay the same between mini-blocks.</br></br>'+
    "<img src='/static/images/miniblock3_color_" + mapping[3] + ".PNG'></img></br>" +
    "This is called a <u>repetition</u>.</div></br>",

    "<div style='font-size:24px'><p style='color:grey;'>Filler</p></div>" +
    "<div style='font-size:24px'>" +
    "The entire sequence will be made up of mini-blocks: </br></br>" +
    "<img src='/static/images/instructions_color_" + mapping[3] + ".PNG'></img></br></br>" +
    "This will make more sense with some practice. </div></br>"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var reward_instructions_reward = {
  type: 'instructions',
  pages: [

    "<div style='font-size:36px'><font color='#FA8072'><h3>The following instructions will explain how</br></br>"+
    "you will be awarded</font> <b>bonus payments</b>.</br></br></br>"+
    "<font color='#FA8072'>Please pay attention!</h3></div></br>",

    "<img src='/static/images/arrow.gif'></img></br>" +
    "<div style='font-size:24px'>Observe the bar that appeared at the top of the screen.</br></br>" +
    "<div style='font-size:24px' align='left'>There are two parts:</br>" +
    "<ul><li><u>Bonus Payment</u> - the total amount of money you have earned</li></ul>"+
    "<img src='/static/images/bonus_payment.PNG'></img></br>"+
    "<ul><li><u>Time Bar</u> - the time left to keep earning money</li></ul>"+
    "<img src='/static/images/time_bar.PNG'></img></div>" +
    "<div><font color='#FA8072'><h3>You want to earn </font>as much money <font color='#FA8072'>as you can" +
    "</br>before the </font>time runs out!</h3></div>",

    "<div style='font-size:24px' align='left'><h1>Reward rules:</h1></br>" +
    "<ul><li>money is awarded randomly (1 cent or 5 cents)</li>"+
    "<li>faster responses give you time to do more trials, which means more reward</li>"+
    "<li>only correct responses are rewarded</li></ul></div></br>",

    "<div style='font-size:24px'>You want to earn as much money as you can before the time runs out!</br>"+
    "<font color='#FA8072'><h3>It is important to know that you get </br><b></font>more money<font color='#FA8072'> for responding </font>"+
    "</br>(1) quickly<font color='#FA8072'> and </font>(2) accurately.</h3></div>"+
    "<div style='font-size:24px' align='center'>It's okay if this doesn't make sense right now. Let's get into a real example!</br></br>" +
    'Click next to review the cues again.',

    "<div style='font-size:24px'><p style='color:grey;'>Filler</p></div>" +
    "<div style='font-size:24px'>Here are the cues and the tasks they indicate:</div>" +
        "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
        "</div>" +
        "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
          "<p class='small'><strong>COLOR task</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
          "<p class='small'><strong>COLOR task</br></strong></p></div>" +
        "</div></br>",
      "<div style='font-size:24px'>Some reminders before you begin:</div></br>" +
        'A is for up (motion) and blue (color)</br>' +
        'L is for down (motion) and red (color)</br></br>' +
        "<font color='#FA8072'><b>You'll no longer be waiting for the '?'</b></font></br>" +
        "You'll have 1.5 seconds to respond.</br></br>" +
      "Please ready your fingers on the A and L keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_prc2 = {
  type: 'instructions',
  pages: [

    "<div style='font-size:24px'>Fantastic! Now you'll start the practice blocks.</div></br>" +
    "Just like in Phase 1, you will have a block of trials, but now we will add cues. </br>" +
    "Before each set of trials you will see a cue that indicates " +
    "the current task to be performed.</br>",
    'You will get a cue followed by a few trials before getting to another cue.</br>' +
    'Do the same task for all the subsequent trials until you get a new cue. </br></br>'+
    "For example, the sequence may be something like this: </br>" +
    "<img src='/static/images/instructions_color_" + mapping[3] + ".PNG'></img></br>" +
    "It's okay if this doesn't make sense right now. Let's get into a real example!</br></br>" +
    'Click next to review the cues again.',
    "<div style='font-size:24px'>Here are the cues and the tasks they indicate:</div>" +
        "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
        "</div>" +
        "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
          "<p class='small'><strong>COLOR task</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
          "<p class='small'><strong>COLOR task</br></strong></p></div>" +
        "</div></br>",
      "<div style='font-size:24px'><h1>Some reminders before you begin:</h1></div>" +
        'A is for up (motion) and blue (color)</br>' +
        'L is for down (motion) and red (color)</br></br>' +
        "<font color='#FA8072'><b>You'll no longer be waiting for the '?'</b></font></br>" +
        "You'll have 1.5 seconds to respond.</br></br>" +
      "Please ready your fingers on the A and L keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var practice_debrief = {
  type: 'html-button-response',
  choices: ['Continue'], //, 'Read Instructions Again'
  is_html: true,
  stimulus: function(){
    var accuracy = jsPsych.data.get().filterCustom(function(x){ return x.trial_type == 'dotmotion' && x.phase == '3.1'}).select('correct');
    var percent_accurate = Math.floor(accuracy.sum() / accuracy.count() * 100)
    //var mean_rt = jsPsych.data.get().filterCustom(function(x){ return x.trial_type == 'dotmotion' && x.phase == '3.1' && x.rt != -1}).select('rt').mean();

    var msg = "<div style='font-size:24px'>Results:</div>" +
      "<p>You responded correctly <strong>"+percent_accurate+"%</strong> of the time.</p>";
    if(percent_accurate >= 75){
      msg += "<p>Great job! Looks like you are ready to continue to the next practice block.</p>"
    }else{
      msg += "<p>Please try to focus and respond correctly more often!</p>"
    }

    return msg;
  },
}

var instructions_prc3 = {
  type: 'instructions',
  pages: [
    "<div style='font-size:32px'><h3>Great job! You've reached the last practice block.</h3></div></br>" +
    "<div style='font-size:24px'>For this block, we <b> remove the cue hints</b> and <b>reduce feedback after each trial</b>.</div></br>" +
    "Just like in the last block, you will have a series of trials, but now there will be no cue hints. </br>"+
    "In addition, the feedback after each trial will only tell you whether it was a motion or color task.</br></br>" +
    'Click next to review the reward rules again.',

    "<div style='font-size:24px' align='left'><h1>Reward rules:</h1></br>" +
    "<ul><li>money is awarded randomly (1 cent or 5 cents)</li>"+
    "<li>faster responses give you time to do more trials, which means more reward</li>"+
    "<li>only correct responses are rewarded</li></ul></div></br>",

    "<div style='font-size:24px'>You want to earn as much money as you can before the time runs out!</br>"+
    "<font color='#FA8072'><h3>It is important to know that you get </br><b></font>more money<font color='#FA8072'> for responding </font>"+
    "</br>(1) quickly<font color='#FA8072'> and </font>(2) accurately.</h3></div>"+
    "<div style='font-size:24px' align='center'>Click next to review the cues again.</div>",

    "<div style='font-size:24px'><p style='color:grey;'>Filler</p></div>" +
    "<div style='font-size:24px'>Here are the cues and the tasks they indicate:</div>" +
        "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
        "</div>" +
        "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
          "<p class='small'><strong>COLOR task</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
          "<p class='small'><strong>COLOR task</br></strong></p></div>" +
        "</div></br>",
      "<div style='font-size:24px'><h1>Some reminders before you begin:</h1></div>" +
      "There will be no cue hints. </br>"+
      "The feedback after each trial will only tell you whether it was a motion or color task.</br></br>" +
        'A is for up (motion) and blue (color)</br>' +
        'L is for down (motion) and red (color)</br></br>' +
        "You'll no longer be waiting for the '?'.</br>" +
        "You'll have 1.5 seconds to respond.</br></br>" +
      "Please ready your fingers on the A and L keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

//generate timeline variables
function generateTrials(vars, phase){
  var task;
  if(vars[0] == 1){
    task = 'color';
  }else if(vars[0] == 2){
    task = 'motion';
  }

  var cue_select = vars[1];
  var cue_shape;
  if(task == "motion"){ //motion
    if(cue_select == 1){
      cue_shape = mapping[1];
    }else if(cue_select == 2){
      cue_shape = mapping[2];
    }
  }else if(task == "color"){ //color
    if(cue_select == 1){
      cue_shape = mapping[3];
    }else if(cue_select == 2){
      cue_shape = mapping[4];
    }
  }

  var coherent_color; // 1-blue, 2-red
  if(vars[2] == 1){
    coherent_color = 'blue';
  }else if(vars[2] == 2){
    coherent_color = 'red';
  }

  var coherent_direction; // 1-up 2-down
  if(vars[3] == 1){
    coherent_direction = 'up';
  }else if(vars[3] == 2){
    coherent_direction = 'down';
  }

  var correct_choice; // 1-a (left), 2-a (right)
  if(vars[8] == 1){
    correct_choice = 'a';
  }else if(vars[8] == 2){
    correct_choice = 'l';
  }

  var task_transition = vars[4]
  var cue_transition = vars[5]
  var response_transition = vars[6]
  var miniblock_size = vars[7]
  var miniblock_trial = vars[9]
  var miniblock = vars[10]
  var block = vars[11]

  return {
      phase: phase,
      task: task,
      cue_shape: cue_shape,
      correct_choice: correct_choice,
      coherent_direction: coherent_direction,
      coherent_color: coherent_color,

      data: {task_transition: task_transition,
            cue_transition: cue_transition,
            response_transition: response_transition,
            miniblock_size: miniblock_size,
            miniblock_trial: miniblock_trial,
            miniblock: miniblock,
            block: block,
            bonus: bonus}
    };
}


// Timer Initializations
var bonus = 0.00;
var block_start_time;
var timer_ticks;
var block_length;
var cur_trial = 0;

var init_timer_practice = {
  type: 'call-function',
  func: function(){
    block_length = 130000
    cur_trial = 0
  }
}

var init_timer_exp = {
  type: 'call-function',
  func: function(){
    block_length = 520000
    cur_trial = 0
  }
}

var show_timer = {
  type: 'call-function',
  func: function(){
    document.querySelector('#srt-score').style.display = 'block';
    document.querySelector('#srt-timer').value = 100;
  }
}

var reset_timer = {
  type: 'call-function',
  func: function(){
    clearInterval(timer_ticks);
    document.querySelector('#srt-timer').value = 100;
  }
}

var reset_score = {
  type: 'call-function',
  func: function(){
    document.querySelector('#srt-bonus').innerHTML = '$0.00'
    bonus = 0.00;
  }
}

var start_timer = {
 type: 'call-function',
 func: function(){
   block_start_time = Date.now();
   timer_ticks = setInterval(function(){
     var proportion_time_elapsed = Math.floor((Date.now() - block_start_time) / block_length * 100);
     document.querySelector('#srt-timer').value = 100 - proportion_time_elapsed;
   }, 100)
  }
 }

// // practice timeline
// practice_timeline = [];
// var repeat_practice = {
//   timeline: practice_timeline,
//   loop_function: function(data){
//     return data.last(1).values()[0].button_pressed == 1;
//   }
// }

// counterbalance showing motion or color first
if(phase3){
  if(parseInt(p1_cb) % 2 == 0){
   timeline.push(instructions_prc);
   timeline.push(instructions_prc_m);
   timeline.push(practice_example1);
   timeline.push(practice_example2);
   timeline.push(practice_example3);
   timeline.push(practice_example3);
   timeline.push(practice_example2);

   timeline.push(instructions_prc_c);
   timeline.push(practice_example4);
   timeline.push(practice_example5);
   timeline.push(practice_example6);
   timeline.push(practice_example6);
   timeline.push(practice_example5);
  }else if(parseInt(p1_cb) % 2 == 1){
   timeline.push(instructions_prc);
   timeline.push(instructions_prc_c);
   timeline.push(practice_example4);
   timeline.push(practice_example5);
   timeline.push(practice_example6);
   timeline.push(practice_example6);
   timeline.push(practice_example5);

   timeline.push(instructions_prc_m);
   timeline.push(practice_example1);
   timeline.push(practice_example2);
   timeline.push(practice_example3);
   timeline.push(practice_example3);
   timeline.push(practice_example2);
  }
}

if(phase31){
  if(reward){
    timeline.push(reward_instructions_prc2);
    timeline.push(show_timer);
    timeline.push(reward_instructions_reward);
  }else{
    timeline.push(instructions_prc2);
  }

  var practice_trials_block1 = [];
  for (line in prc_lines_1){
    practice_trials_block1.push(generateTrials(prc_lines_1[line], '3.1')); //generate timeline variables
  }

   var cf_conditional_block1 = {
    timeline: [cue, fixation],
    timeline_variables: practice_trials_block1,
    sample: {
       type: 'custom',
       fn: function(t){
           // the first parameter to this function call is an array of integers
           // from 0 to n-1, where n is the number of trials.
           // the method needs to return an array of integers specifying the order
           // that the trials should be executed. this array does not need to
           // contain all of the integers.

           return [t[cur_trial]];
       }
    },
    conditional_function: function(){
        if(practice_trials_block1[cur_trial].data.miniblock_trial == '1'){
            return true;
        }else{
            return false;
        }
      }
    }

   var practice_block1 = {
     timeline: [cf_conditional_block1, stimulus, fixation],
     timeline_variables: practice_trials_block1,
     sample: {
        type: 'custom',
        fn: function(t){
            // the first parameter to this function call is an array of integers
            // from 0 to n-1, where n is the number of trials.
            // the method needs to return an array of integers specifying the order
            // that the trials should be executed. this array does not need to
            // contain all of the integers.
            return [t[cur_trial]];
        }
     },
     loop_function: function(practice_block1){
       // increment the current trial
       if(cur_trial < practice_trials_block1.length - 1){
         cur_trial = cur_trial + 1;
       }else{
         cur_trial = 0;
       }

       if(Date.now() - block_start_time < block_length){
          return true;
       } else {
          return false;
       }

      }
     }

    timeline.push(init_timer_practice, start_timer, practice_block1);
    timeline.push(reset_timer, practice_debrief)
    //timeline.push(repeat_practice)

}

if(phase32){
  if(debug){
    timeline.push(show_timer);
  }
  timeline.push(instructions_prc3)

  var practice_trials_block2 = [];
  for (line in prc_lines_2){
    practice_trials_block2.push(generateTrials(prc_lines_2[line], '3.2')); //generate timeline variables
  }

   var cf_conditional_block2 = {
    timeline: [cue, fixation],
    timeline_variables: practice_trials_block2,
    sample: {
       type: 'custom',
       fn: function(t){
           // the first parameter to this function call is an array of integers
           // from 0 to n-1, where n is the number of trials.
           // the method needs to return an array of integers specifying the order
           // that the trials should be executed. this array does not need to
           // contain all of the integers.

           return [t[cur_trial]];
       }
    },
    conditional_function: function(){
        if(practice_trials_block2[cur_trial].data.miniblock_trial == '1'){
            return true;
        }else{
            return false;
        }
      }
    }

   var practice_block2 = {
     timeline: [cf_conditional_block2, stimulus, fixation],
     timeline_variables: practice_trials_block2,
     sample: {
        type: 'custom',
        fn: function(t){
            // the first parameter to this function call is an array of integers
            // from 0 to n-1, where n is the number of trials.
            // the method needs to return an array of integers specifying the order
            // that the trials should be executed. this array does not need to
            // contain all of the integers.
            return [t[cur_trial]];
        }
     },
     loop_function: function(){
       // increment the current trial
       if(cur_trial < practice_trials_block2.length - 1){
         cur_trial = cur_trial + 1;
       }else{
         cur_trial = 0;
       }

       if(Date.now() - block_start_time < block_length){
          return true;
       } else {
          return false;
       }

      }
     }

    timeline.push(init_timer_practice, start_timer, practice_block2);

}

// --------------------
// FOURTH PHASE
// --------------------
if(reward){
  var reward_questions = {
    type: 'survey-multi-choice',
    preamble: "<img src='/static/images/" + reward_input[condition] + "_rule_" + mapping[3] + ".PNG'></img>"+
    '</br><div align="left"> Please correctly answer the following questions about the point rewards. Press <u>enter</u> to submit.</div>',
    questions: [
      {prompt: "What kinds of responses are rewarded?", options: ["Fast", "Accurate", "Fast and Accurate"], required: true, horizontal: false,},
      {prompt: "How many points are awarded for each trial after a task switch?", options: ["1 point", "3 points"], required: true, horizontal: false,},
      {prompt: "How many points are awarded for each trial after a task repetition?", options: ["1 point", "3 points"], required: true, horizontal: false}
    ],
  };

  var reward_instructions_exp1 = {
    type: 'instructions',
    pages: [
        '<div style="font-size:54px">Welcome to the <strong>Phase 4</strong>! </div></br>' +
        "<h1>This is the <font color='#FA8072'>real experiment!</font></h1>" +
        "<h2><font color='#FA8072'>There are two 8-minute blocks</font> in this phase,</br>during which you <font color='#FA8072'>earning bonus payment.</font></h2>" +
        "The format is the same as Phase 3, but with no hints or feedback.</br>" +
        "<b>The only feedback you'll get is whether your answer was correct or incorrect!</b></br></br>" +
        "<font color='#FA8072'>Also, your bonus from the practice block has been reset to $0.00!</font></br>",

        "<div style='font-size:24px' align='left'><h1>Reward rules:</h1></br>" +
        "<ul><li>money is awarded randomly (1 cent or 5 cents)</li>"+
        "<li>faster responses give you time to do more trials, which means more reward</li>"+
        "<li>only correct responses are rewarded</li></ul></div></br>",

        "<div style='font-size:24px'>You want to earn as much money as you can before the time runs out!</br>"+
        "<font color='#FA8072'><h3>It is important to know that you get </br><b></font>more money<font color='#FA8072'> for responding </font>"+
        "</br>(1) quickly<font color='#FA8072'> and </font>(2) accurately.</h3></div>"+
        "<div style='font-size:24px' align='center'>Click next to review the cues again.</div>",

        "<div style='font-size:24px'><p style='color:grey;'>Filler</p></div>" +
        "<div style='font-size:24px'>Here are the cues and the tasks they indicate:</div>" +
            "<div class='row'>"+
            "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
            "<p class='small'><strong>MOTION task</br></strong></p></div>" +
            "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
            "<p class='small'><strong>MOTION task</br></strong></p></div>" +
            "</div>" +
            "<div class='row'>"+
            "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
            "<p class='small'><strong>COLOR task</br></strong></p></div>" +
            "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
            "<p class='small'><strong>COLOR task</br></strong></p></div>" +
            "</div>",
          "<div style='font-size:24px'><h1>Some reminders before you begin:</h1></div>" +
          "There are two 8-minute blocks in this phase, with a short break in the middle!</br></br>" +
          "<b>The only feedback you'll get is whether your answer was correct or incorrect!</b></br></br>" +
            'A is for up (motion) and blue (color)</br>' +
            'L is for down (motion) and red (color)</br></br>' +
          "Please ready your fingers on the A and L keys and press next whenever you're ready!"

    ],
    show_clickable_nav: true,
    post_trial_gap: 1000
  };
}


var instructions_exp = {
  type: 'instructions',
  pages: [
      '<div style="font-size:32px">Welcome to the <strong>Phase 4</strong>. </div></br>' +
      "This phase will take approximately <b>20 minutes</b>, with a short break in the middle!</br></br>" +
      "The format is the same as Phase 3, but with no hints or feedback.</br>" +
      "<b>The only feedback you'll get is whether your answer was correct or incorrect!</b></br></br>" +
      'Click next to review the cues again.',
      "<div style='font-size:24px'>Here are the cues and the tasks they indicate:</div>" +
          "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
          "</div>" +
          "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
          "<p class='small'><strong>COLOR task</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
          "<p class='small'><strong>COLOR task</br></strong></p></div>" +
          "</div>",
        "<div style='font-size:24px'>Some reminders before you begin:</div></br>" +
        "<b>The only feedback you'll get is whether your answer was correct or incorrect!</b></br></br>" +
          'A is for up (motion) and blue (color)</br>' +
          'L is for down (motion) and red (color)</br></br>' +
          "You'll no longer be waiting for the '?'.</br>" +
          "You'll have three seconds to respond.</br></br>" +
          "Remember, this phase will take approximately <b>20 minutes</b>, with a short break in the middle!</br></br>" +
        "Please ready your fingers on the A and L keys and press next whenever you're ready!"

  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var pause_text = {
  type: 'instructions',
  pages: [
        "<div style='font-size:32px'>Great job! You're halfway there.</div></br>"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var reward_instructions_exp2 = {
  type: 'instructions',
  pages: [
      "<div style='font-size:24px' align='left'><h1>Reward rules:</h1></br>" +
      "<ul><li>money is awarded randomly (1 cent or 5 cents)</li>"+
      "<li>faster responses give you time to do more trials, which means more reward</li>"+
      "<li>only correct responses are rewarded</li></ul></div></br>" +
      "<div style='font-size:24px' align='center'>Click next to review the cues again.</div>",

      "<div style='font-size:24px'>Here are the cues and the tasks they indicate:</div>" +
          "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
          "<p class='small'><strong>MOTION task</br></strong></p></div>" +
          "</div>" +
          "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
          "<p class='small'><strong>COLOR task</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
          "<p class='small'><strong>COLOR task</br></strong></p></div>" +
          "</div>",
          "<div style='font-size:24px'>Some reminders before you resume:</div></br>" +
            'A is for up (motion) and blue (color)</br>' +
            'L is for down (motion) and red (color)</br></br>' +
          "Please ready your fingers on the A and L keys and press next whenever you're ready!"

  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

if(phase4){
  if(debug){
    timeline.push(show_timer);
  }
  if(reward){
    timeline.push(reset_timer, reset_score, reward_instructions_exp1);
    //timeline.push(reward_questions)
  }else{
    timeline.push(instructions_exp);
  }

  var exp_trials_block1 = [];
  for (line in exp_lines_1){
    exp_trials_block1.push(generateTrials(exp_lines_1[line], '4.1')); //generate timeline variables
  }

   var cf_conditional_block1 = {
    timeline: [cue, fixation],
    timeline_variables: exp_trials_block1,
    sample: {
       type: 'custom',
       fn: function(t){
           // the first parameter to this function call is an array of integers
           // from 0 to n-1, where n is the number of trials.
           // the method needs to return an array of integers specifying the order
           // that the trials should be executed. this array does not need to
           // contain all of the integers.

           return [t[cur_trial]];
       }
    },
    conditional_function: function(){
        if(exp_trials_block1[cur_trial].data.miniblock_trial == '1'){
            return true;
        }else{
            return false;
        }
      }
    }

   var exp_block1 = {
     timeline: [cf_conditional_block1, stimulus, fixation],
     timeline_variables: exp_trials_block1,
     sample: {
        type: 'custom',
        fn: function(t){
            // the first parameter to this function call is an array of integers
            // from 0 to n-1, where n is the number of trials.
            // the method needs to return an array of integers specifying the order
            // that the trials should be executed. this array does not need to
            // contain all of the integers.
            return [t[cur_trial]];
        }
     },
     loop_function: function(){
       // increment the current trial
       if(cur_trial < exp_trials_block1.length - 1){
         cur_trial = cur_trial + 1;
       }else{
         cur_trial = 0;
       }

       if(Date.now() - block_start_time < block_length){
          return true;
       } else {
          return false;
       }

      }
     }

    timeline.push(init_timer_exp, start_timer, exp_block1);

    timeline.push(reset_timer, pause_text);
    timeline.push(reward_instructions_exp2);

    var exp_trials_block2 = [];
    for (line in exp_lines_2){
      exp_trials_block2.push(generateTrials(exp_lines_2[line], '4.2')); //generate timeline variables
    }

     var cf_conditional_block2 = {
      timeline: [cue, fixation],
      timeline_variables: exp_trials_block2,
      sample: {
         type: 'custom',
         fn: function(t){
             // the first parameter to this function call is an array of integers
             // from 0 to n-1, where n is the number of trials.
             // the method needs to return an array of integers specifying the order
             // that the trials should be executed. this array does not need to
             // contain all of the integers.

             return [t[cur_trial]];
         }
      },
      conditional_function: function(){
          if(exp_trials_block2[cur_trial].data.miniblock_trial == '1'){
              return true;
          }else{
              return false;
          }
        }
      }

     var exp_block2 = {
       timeline: [cf_conditional_block2, stimulus, fixation],
       timeline_variables: exp_trials_block2,
       sample: {
          type: 'custom',
          fn: function(t){
              // the first parameter to this function call is an array of integers
              // from 0 to n-1, where n is the number of trials.
              // the method needs to return an array of integers specifying the order
              // that the trials should be executed. this array does not need to
              // contain all of the integers.
              return [t[cur_trial]];
          }
       },
       loop_function: function(){
         // increment the current trial
         if(cur_trial < exp_trials_block2.length - 1){
           cur_trial = cur_trial + 1;
         }else{
           cur_trial = 0;
         }

         if(Date.now() - block_start_time < block_length){
            return true;
         } else {
            return false;
         }

        }
       }

      timeline.push(init_timer_exp, start_timer, exp_block2);
}

var instructions_final = {
  type: 'instructions',
  pages: [
      '<div style="font-size:32px">Congratulations on finishing the experiment!</div></br></br>' +
      'Press next to finish the HIT!'
  ],
  show_clickable_nav: true,
  post_trial_gap: 0
};

var instructions_reward_final = {
  type: 'instructions',
  pages: [
      "<div style='font-size:32px'>Congratulations on finishing the experiment!</div></br>"
  ],
  show_clickable_nav: true,
  post_trial_gap: 0
};

// defining groups of questions that will go together
var exit_survey = {
  type: 'survey-text',
  preamble: "The experiment is now over, but we have two questions to ask you as the last part of the experiment.",
  questions: [{prompt: "During the experiment, did you notice any patterns in how the bonus was awarded?", rows: 5, columns: 60},],
};

var exit_survey2 = {
  type: 'survey-text',
  questions: [{prompt: "What do you think the purpose of the experiment was?", rows: 5, columns: 60},],
};

var instructions_reward_final2 = {
    type: 'html-keyboard-response',
    stimulus: '',
    on_start: function(instructions_reward_final){
      instructions_reward_final.stimulus = '<div style="font-size:24px">Your total final bonus is $'+ bonus.toString() + '.</br></br>' +
      'Press <u>any key</u> to finish the HIT!';
    },
};

if(reward){
  timeline.push(reset_timer, instructions_reward_final);
  timeline.push(exit_survey,exit_survey2)
  timeline.push(instructions_reward_final2);
}else{
  timeline.push(instructions_final);
}

// record id, condition, counterbalance on every trial
jsPsych.data.addProperties({
    uniqueId: uniqueId,
    condition: condition, // 0 or 1 for the two effort groups
    counterbalance: counterbalance, // counterbalance number (total: 32)
    sequence: experiment_sequence, // sequence number (total: 32)
    phase1_counterbalance: p1_cb, // 0: motion color, 1: color motion
    phase2_counterbalance: p2_cb, // 0: circle triangle first, 1: diamond square first
});

//---------Run the experiment---------
jsPsych.init({
    timeline: timeline,
    //show_progress_bar: true,

    display_element: 'jspsych-target',

    // record data to psiTurk after each trial
    on_data_update: function(data) {
      if(!debug){
        psiturk.recordTrialData(data);
      }
    },


    on_finish: function() {
      //jsPsych.data.displayData(); //Display the data onto the browser screen
      //jsPsych.data.getInteractionData();

      if(!debug){
        // save data
        psiturk.saveData({
            success: function() {
              psiturk.completeHIT();
            },
            error: function() {
              psiturk.completeHIT();
            }
        });
      }
    },

});
