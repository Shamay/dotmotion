/* load psiturk */
var psiturk = new PsiTurk(uniqueId, adServerLoc, mode);

//The main timeline to be fed into jsPsych.init
var timeline = [];

//condition = counterbalance = 1; // debug mode

// Setting up counterbalancing conditions
var num_sequences = 8; // number of sequences we want to use
var sequence = (counterbalance % num_sequences) + 1; // compute the sequence number from counterbalance assignment

// compute the counterbalance conditions based on counterbalance assignment
var p1_cb, p2_cb;
if(counterbalance < 8){
  p1_cb = 0;
  p2_cb = 0;
}else if(counterbalance < 16){
  p1_cb = 1;
  p2_cb = 0;
}else if(counterbalance < 24){
  p1_cb = 0;
  p2_cb = 1;
}else if(counterbalance < 32){
  p1_cb = 1;
  p2_cb = 1;
}

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

// generate the proper file names for the practice (phase 3) and test (phase 4) data
var trial_url = "/static/trial_data/effortGroup_" + (parseInt(condition) + 1) + "_sequence" + parseInt(sequence) + ".csv";

var practice_url; // for the practice sequence, select the next sequence number
if(parseInt(sequence) == num_sequences){ // (wraps around)
  practice_url = "/static/trial_data/effortGroup_" + (parseInt(condition) + 1) + "_sequence1.csv";
}else{
  practice_url = "/static/trial_data/effortGroup_" + (parseInt(condition) + 1) + "_sequence" + (parseInt(sequence) + 1) + ".csv";
}

$.ajax({
    url: practice_url, // load the practice file (phase 3)
    async: false,
    dataType: "text",
    success: function (response) {
      processData(response, 1);
    }
 });

 $.ajax({
     url: trial_url, // load the test file (phase 4)
     async: false,
     dataType: "text",
     success: function (response) {
       processData(response, 2);
     }
  });

// This function reads into the trial sequence csv files
//    option: 1 = practice (phase 3), 2 = test (phase 4)
//    allText: raw text from csv files loaded above
function processData(allText, option) {
    var allTextLines = allText.split(/\r\n|\n/);

    // extract the headers into the respective variable
    if(option == 1){
      prc_headers = allTextLines[0].split(',');
      number_miniblocks = 12; // number of miniblocks to extract for practice trials
      prc_lines_1 = [];
      prc_lines_2 = [];
    }else if(option == 2){
      exp_headers = allTextLines[0].split(',');
      exp_lines = [];
    }

    // loop through each line (trial) in the sequence
    for (var i=1; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if(option == 1){
          if (data.length == prc_headers.length){
            if(parseInt(data[10]) <= number_miniblocks / 2){ // extract first half of miniblocks
              var tarr = [];
              // loop through the individual elements on each line (trial)
              for (var j=0; j<prc_headers.length; j++) {
                  tarr.push(data[j]);
              }
              prc_lines_1.push(tarr);
            }else if(parseInt(data[10]) <= number_miniblocks){ // extract second half of miniblocks
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
              var tarr = [];
              // loop through the individual elements on each line (trial)
              for (var j=0; j<exp_headers.length; j++) {
                  tarr.push(data[j]);
              }
              exp_lines.push(tarr);
          }
        }
    }
}

// fullscreen mode

timeline.push({
  type: 'fullscreen',
  fullscreen_mode: true,
  message: '<p>The experiment will swap to full screen mode when you press the button below</p>',
  button_label: 'Start Experiment'
});


//---------Create trials---------

// Generates template for cue stimulus
//    phase: "3.1", "3.2", or "4"
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
        cue.stimulus = "<div style='width: 700px;'>" +
           "<div style='float: center;'><img src='/static/images/" + cue.cue_shape + ".png'></img></div>" +
        "(this cues a " + cue.task + " task)</div>"; // extra feedback

        cue.trial_duration = cue.trial_duration + 2000; //extend the cue duration if it's still the practice phase

      }else{ // phase 3.1 or 4
        cue.stimulus = "<div style='float: center;'><img src='/static/images/" + cue.cue_shape + ".png'></img></div>";
      }
    }
  }
}

// Generates template for fixation stimulus
//    phase: "1.1", "1.2", "3.1", "3.2", or "4"
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
          fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
          '<div style="color:white;font-size:30px"; class = center-text><b>Correct</b>'+
          '</div><p style="color:grey;">Filler</p>';
        }else if(!data.correct){
          if(data.rt == -1){
            if(fixation.phase == '3.1'){
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Respond Faster</b>' +
              "</div><p>Do not wait for the '?', respond as soon as you can.</p>";
            }else{
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Respond Faster</b>' +
              "</div><p>Respond as fast as you can when you see the '?'.</p>";
            }
            fixation.trial_duration = fixation.trial_duration + 500;
          }else if(data.task == 'motion'){
            if(data.correct_choice == 'a'){
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Incorrect</b>' +
              '</div><p>Press A for mostly upward motion.</p>';
            }else if(data.correct_choice == 'l'){
              fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
              '<div style="color:white;font-size:30px"; class = center-text><b>Incorrect</b>' +
              '</div><p>Press L for mostly downward motion.</p>';
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
          }
          fixation.trial_duration = fixation.trial_duration + 1750;
        }else if(config.fixation_cross){
          fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
        }
      }else if(fixation.phase == '3.2'){
        if(typeof data.correct === "undefined"){
          fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
        }else if(data.correct){
          fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
          '<div style="color:white;font-size:30px"; class = center-text><b>Correct</b>'+
          '</div><p style="color:grey;">Filler</p>';
        }else if(!data.correct){
          if(data.rt == -1){
            fixation.prompt = '<p style="color:grey;font-size:12px">Filler</p>' +
            '<div style="color:white;font-size:30px"; class = center-text><b>Respond Faster</b>' +
            "</div><p>Do not wait for the '?', respond as soon as you can.</p>";
            fixation.trial_duration = fixation.trial_duration + 500;
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
      }else if(fixation.phase == '4'){
        if(config.task_feedback){
          if(typeof data.correct === "undefined"){
            fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
          }else if(data.correct){
            fixation.prompt = '<div style="color:white;font-size:30px"; class = center-text><b>Correct</b></div>';
          }else if(!data.correct){
            if(data.rt == -1){
              fixation.prompt = '<div style="color:white;font-size:30px"; class = center-text><b>Respond Faster</b></div>';
            }else{
              fixation.prompt = '<div style="color:white;font-size:30px"; class = center-text><b>Incorrect</b></div>';
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

    if(fixation.phase == '3.1' || fixation.phase == '3.2' || fixation.phase == '4'){
      // dynamically change inter_trial_interval
      if(data.response_ends_trial && data.fill_ITT && data.rt != -1){
        fixation.trial_duration += Math.floor(data.trial_duration - data.rt);
      }
    }
  }
}

// Generates template for fixation stimulus
//    phase: "1.1", "1.2", "3.1", "3.2", or "4"
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
    var data = jsPsych.data.get().last(2).values()[0];

    if(stimulus.phase == '1.1'){
      // update coherence for staircasing
      if(typeof data.correct === "undefined"){
        currentMotionCoherence = currentMotionCoherence + (2*learningRate - 0.002);
      }else if(data.correct){
        if(currentMotionCoherence > minMotionCoherence){
          currentMotionCoherence = currentMotionCoherence - learningRate;
        }
      }else{
        if(currentMotionCoherence < maxCoherence){
          if(currentMotionCoherence + (2*learningRate - 0.002) >= maxCoherence){
            currentMotionCoherence = maxCoherence;
          }else{
            currentMotionCoherence = currentMotionCoherence + (2*learningRate - 0.002);
          }
        }
      }

      stimulus.motionCoherence = currentMotionCoherence;

    }else if(stimulus.phase == '1.2'){
      // update coherence for staircasing
      if(typeof data.correct === "undefined"){
        currentColorCoherence = currentColorCoherence + (2*learningRate - 0.002);
      }else if(data.correct){
        if(currentColorCoherence > minColorCoherence){
          currentColorCoherence = currentColorCoherence - learningRate;
        }
      }else{
        if(currentColorCoherence < maxCoherence){
          if(currentColorCoherence + (2*learningRate - 0.002) >= maxCoherence){
            currentColorCoherence = maxCoherence;
          }else{
            currentColorCoherence = currentColorCoherence + (2*learningRate - 0.002);
          }
        }
      }

      stimulus.colorCoherence = currentColorCoherence;

    }else{
      stimulus.motionCoherence = currentMotionCoherence;
      stimulus.colorCoherence = currentColorCoherence;
    }
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
var numTrials = 70;
var currentMotionCoherence = 0.45; // starting coherence
var currentColorCoherence = 0.45; // starting coherence
var learningRate = 0.011;
var minMotionCoherence = 0.08;
var minColorCoherence = 0.05;
var maxCoherence = 0.80;
var percentageCorrect = 0;

/* define introduction block */
var introduction = {
  type: 'instructions',
  pages: [
      '<div style="font-size:36px">Welcome to the dot-motion experiment!</div>' +
      '<div align="left"><p>There will be four phases:</p>' +
      '<ul><li><b>Phase 1:</b> you will get to know the color and motion tasks.</li>' +
      '<li><b>Phase 2:</b> you will learn whether a cue indicates color or motion.</li>' +
      '<li><b>Phase 3:</b> you will practice swaping between color or motion tasks.</li>' +
      '<li><b>Phase 4:</b> you will be cued to swap between color or motion tasks.</p></li></ul></br>' +
      '</div>The experiment will take approximately one hour to complete.' +
      '<p>Click next to continue.</p>',
      "<div style='font-size:32px'>Welcome to the <strong>Phase 1</strong>.</div></br>" +
      "<div style='font-size:24px'>Let's learn about the <u>stimulus</u>.</div>" +
      "<p>A swarm of red and blue dots will be moving on the screen.</p>" //+
      //"<p>Click next for an example.</p>" +
      //"<form action='?' method='POST'>" +
      //"<div class='g-recaptcha' data-sitekey='your_site_key'></div><br/>" +
      //"<input type='submit' value='Submit'>" +
    //"</form>"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};
timeline.push(introduction);

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
timeline.push(stim_example);

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
      "<p>In the <strong>motion</strong> task, you must figure out which direction the majority of the dots are going.</p>" +
      "<div class='row'>" +
        "<div class='column' style='float:center; border-style: solid; border-right: 0;'>If most of the dots are going <strong>upward</strong>,</br>" +
        "press the <u>A key</u>.</br></br><img src='/static/images/up.gif'></img>" +
        "</br><strong>Press A for majority up</strong></div>" +
        "<div class='column' style='float:center; border-style: solid;'>If most of the dots are going <strong>downward</strong>,</br>"+
        "press the <u>L key</u>.</br></br><img src='/static/images/down.gif'></img>" +
        "</br><strong>Press L for majority down</strong></div>" +
      "</div></br>Press next for an example of each."],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_color = {
  type: 'instructions',
  pages: ["<div style='font-size:32px'>Color Instructions</div>" +
  "<p>In the <strong>color</strong> task, you must figure out the color of the majority of the dots.</p>" +
      "<div class='row'>" +
        "<div class='column' style='float:center; border-style: solid; border-right: 0;'>If most of the dots are <strong>blue</strong>,</br>" +
        "press the <u>A key</u>.</br></br><img src='/static/images/blue.gif'></img>" +
        "</br><strong>Press A for majority blue</strong></div>" +
        "<div class='column' style='float:center; border-style: solid;'>If most of the dots are <strong>red</strong>,</br>"+
        "press the <u>L key</u>.</br></br><img src='/static/images/red.gif'></img>" +
        "</br><strong>Press L for majority red</strong></div>" +
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
  pages: ["<div style='font-size:32px'>Motion Block</div></br>" +
      "In this block, you will focus on MOTION. There will be around "+numTrials+" motion tasks.</br></br>" +
      "As you get more trials correct, they will get harder. Try to reach</br>" +
      "your highest performance level and stay at that for a while.</br></br>" +
      "Remember:</br></br>"+
      "You can only respond when you see the '?'.</br></br>" +
      "A key = majority UP </br>" +
      "L key = majority DOWN </br></br>" +
      "Press next to begin the motion block!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_color_block = {
  type: 'instructions',
  pages: ["<div style='font-size:32px'>Color Block</div></br>" +
      "In this block, you will focus on COLOR. There will be around "+numTrials+" color tasks.</br></br>" +
      "As you get more trials correct, they will get harder. Try to reach</br>" +
      "your highest performance level and stay at that for a while.</br></br>" +
      "Remember:</br></br>"+
      "You can only respond when you see the '?'.</br></br>" +
      "A key = majority BLUE </br>" +
      "L key = majority RED </br></br>" +
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
    text: 'Majority Down (Press L)',
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
    text: 'Majority Up (Press A)',
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
    text: 'Majority Red (Press L)',
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
    text: 'Majority Blue (Press A)',
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
if(p1_cb % 2 == 0){
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
}else{
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
var maxTrials = 50;

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
        if(sum >= 18 || trial_counter >= 100){
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
             "You need "+ (18-sum) + " more correct trials to move on!</div>"+
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

// --------------------
// THIRD PHASE
// --------------------
var instructions_prc = {
  type: 'instructions',
  pages: [
    '<div style="font-size:32px">Welcome to the <strong>Phase 3</strong>. </div></br>'+
    '<div style="font-size:24px">We will be swaping between color and motion tasks.</div></br>' +
    'The cues you learned earlier will tell you if you </br>'+
    'are supposed to focus on color or motion.</br></br>',
  ],
  show_clickable_nav: true
};

var instructions_prc_m = {
  type: 'instructions',
  pages: [
    '<div style="font-size:24px">We will now focus on the <u>motion</u> cues.</div></br>' +
    'You will see a motion cue (' + mapping[1] + ' or ' + mapping[2] + ')'+
    ' and then complete a number of motion tasks.</br></br>' +
    "<b>Remember:</b></br>" +
    "We're coming back to 'A' or 'L' responses.</br>" +
    'A is for majority upward motion.</br>' +
    'L is for majority downward motion.</br></br>' +
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
    phase: '3.1'
  }],
}

var practice_example2 = {
  timeline: [stimulus,fixation],
  timeline_variables: [{
    task: 'motion',
    correct_choice: 'a',
    coherent_direction: 'up',
    coherent_color: 'blue',
    text: 'Motion Task - Up (Press A)',
    trial_duration: 4000,
    phase: '3.1'
  }],
}

var practice_example3 = {
  timeline: [stimulus,fixation],
  timeline_variables: [{
    task: 'motion',
    correct_choice: 'l',
    coherent_direction: 'down',
    coherent_color: 'red',
    text: 'Motion Task - Down (Press L)',
    trial_duration: 4000,
    phase: '3.1'
  }],
}

var instructions_prc_c = {
  type: 'instructions',
  pages: [
    '<div style="font-size:24px">We will now focus on the <u>color</u> cues.</div></br>' +
    'You will see a color cue (' + mapping[3] + ' or ' + mapping[4] + ')' +
    ' and then complete a number of color tasks.</br></br>' +
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
};

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
    phase: '3.1'
  }],
}

var practice_example5 = {
  timeline: [stimulus,fixation],
  timeline_variables: [{
    task: 'color',
    correct_choice: 'l',
    coherent_direction: 'down',
    coherent_color: 'red',
    text: 'Color Task - Red (Press L)',
    trial_duration: 4000,
    phase: '3.1'
  }],
}

var practice_example6 = {
  timeline: [stimulus,fixation],
  timeline_variables: [{
    task: 'color',
    correct_choice: 'a',
    coherent_direction: 'up',
    coherent_color: 'blue',
    text: 'Color Task - Blue (Press A)',
    trial_duration: 4000,
    phase: '3.1'
  }],
}

var instructions_prc2 = {
  type: 'instructions',
  pages: [
    "<div style='font-size:24px'>Fantastic! Now you'll start the practice blocks.</div></br>" +
    "Just like in Phase 1, you will have a block of trials, but now we will add cues. </br>" +
    "Before each set of trials you will see a cue that indicates " +
    "the current task to be performed.</br>",
    'You will get a cue followed by a few trials before getting to another cue.</br></br>' +
    'Do the same task for all the subsequent trials until you get a new cue. </br></br>'+
    "For example, the sequence may be something like this: </br>" +
    "<b>"+mapping[1]+" cue</b> -> motion task -> motion task -> motion task -> motion task -> motion task -> </br> " +
    "<b>"+mapping[3]+" cue</b> -> color task -> color task -> color task -> color task -> </br>" +
    "<b>"+mapping[4]+" cue</b> -> color task -> color task -> color task ...</br></br>" +
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
      "<div style='font-size:24px'>Some reminders before you begin:</div></br>" +
        'A is for up (motion) and blue (color)</br>' +
        'L is for down (motion) and red (color)</br></br>' +
        "<font color='#FA8072'><b>You'll no longer be waiting for the '?'</b></font></br>" +
        "You'll have three seconds to respond.</br></br>" +
      "Please ready your fingers on the A and L keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_prc3 = {
  type: 'instructions',
  pages: [
    "<div style='font-size:32px'>Great job! You've reached the last practice block.</div></br>" +
    "<div style='font-size:24px'>For this block, we <b> remove the cue hints</b> and <b>reduce feedback after each trial</b>.</div></br>" +
    "Just like in the last block, you will have a series of trials, but now there will be no cue hints. </br>"+
    "In addition, the feedback after each trial will only tell you whether it was a motion or color task.</br></br>" +
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
      "<div style='font-size:24px'>Some reminders before you begin:</div></br>" +
      "There will be no cue hints. </br>"+
      "The feedback after each trial will only tell you whether it was a motion or color task.</br></br>" +
        'A is for up (motion) and blue (color)</br>' +
        'L is for down (motion) and red (color)</br></br>' +
        "You'll no longer be waiting for the '?'.</br>" +
        "You'll have three seconds to respond.</br></br>" +
      "Please ready your fingers on the A and L keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

timeline.push(instructions_prc);

// counterbalance showing motion or color first
if(parseInt(p1_cb) % 2 == 0){
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
}else{
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

//generate timeline variables
function generateTrials(vars, phase){
  var task;
  if(vars[0] == 1){
    task = 'motion';
  }else if(vars[0] == 2){
    task = 'color';
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

  var coherent_direction; // 1-up 2-down
  if(vars[2] == 1){
    coherent_direction = 'up';
  }else if(vars[2] == 2){
    coherent_direction = 'down';
  }

  var coherent_color; // 1-blue, 2-red
  if(vars[3] == 1){
    coherent_color = 'blue';
  }else if(vars[3] == 2){
    coherent_color = 'red';
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

  return [{
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
            block: block}
    }];
}

timeline.push(instructions_prc2);

for (line in prc_lines_1){
  var trial_vars_prc = generateTrials(prc_lines_1[line], '3.1'); //generate timeline variables

    // if new miniblock then, else
  if(trial_vars_prc[0].data.miniblock_trial == 1){
    var cue_sequence = {
      timeline: [cue, fixation, stimulus, fixation],
      timeline_variables: trial_vars_prc
      }
    timeline.push(cue_sequence);
  }else{
    var stim_sequence = {
      timeline: [stimulus, fixation],
      timeline_variables: trial_vars_prc
      }
    timeline.push(stim_sequence);
  }
}

timeline.push(instructions_prc3)

for (line in prc_lines_2){
  var trial_vars_prc = generateTrials(prc_lines_2[line], '3.2'); //generate timeline variables

    // if new miniblock then, else
  if(trial_vars_prc[0].data.miniblock_trial == 1){
    var cue_sequence = {
      timeline: [cue, fixation, stimulus, fixation],
      timeline_variables: trial_vars_prc
      }
    timeline.push(cue_sequence);
  }else{
    var stim_sequence = {
      timeline: [stimulus, fixation],
      timeline_variables: trial_vars_prc
      }
    timeline.push(stim_sequence);
  }
}

// --------------------
// FOURTH PHASE
// --------------------
var instructions_exp = {
  type: 'instructions',
  pages: [
      '<div style="font-size:32px">Welcome to the <strong>Phase 4</strong>. </div></br>' +
      "This phase will take approximately <b>30 minutes</b>, with a short break in the middle!</br></br>" +
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
          "Remember, this phase will take approximately <b>30 minutes</b>, with a short break in the middle!</br></br>" +
        "Please ready your fingers on the A and L keys and press next whenever you're ready!"

  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};
timeline.push(instructions_exp);

var pause_text = {
  type: 'instructions',
  pages: [
        "<div style='font-size:32px'>Great job! You're halfway there.</div></br></br>" +
        "<div style='font-size:24px'>Some reminders before you resume:</div></br>" +
          'A is for up (motion) and blue (color)</br>' +
          'L is for down (motion) and red (color)</br></br>' +
        "Please ready your fingers on the A and L keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var pause = true;
for (line in exp_lines){
  var trial_vars_exp = generateTrials(exp_lines[line], '4'); //generate timeline variables
  // pause before block two
  if(pause && trial_vars_exp[0].data.block == 2){
    pause = false;
    timeline.push(pause_text);
  }
  // if new miniblock then, else
  if(trial_vars_exp[0].data.miniblock_trial == 1){
    var cue_sequence = {
      timeline: [cue, fixation, stimulus, fixation],
      timeline_variables: trial_vars_exp
      }
    timeline.push(cue_sequence);
  }else{
    var stim_sequence = {
      timeline: [stimulus, fixation],
      timeline_variables: trial_vars_exp
      }
    timeline.push(stim_sequence);
  }
}

// record id, condition, counterbalance on every trial
jsPsych.data.addProperties({
    uniqueId: uniqueId,
    condition: condition, // 0 or 1 for the two effort groups
    //counterbalance: counterbalance // counterbalance number (total: 32)
    sequence: sequence, // sequence number (total: 8)
    phase1_counterbalance: p1_cb, // 0: motion color, 1: color motion
    phase2_counterbalance: p2_cb // 0: circle triangle first, 1: diamond square first
});

//---------Run the experiment---------
jsPsych.init({
    timeline: timeline,
    show_progress_bar: true,

    //display_element: 'jspsych-target',


    // record data to psiTurk after each trial
    on_data_update: function(data) {
        psiturk.recordTrialData(data);
    },


    on_finish: function() {
      //jsPsych.data.displayData(); //Display the data onto the browser screen

      /*

      //jsPsych.data.getInteractionData(); LOOK INTO THIS

      //jsPsych.data.localSave('testSave.csv', 'csv'); //Save the data locally in a .csv file

      // select task trials
      var task_trials = jsPsych.data.get().filter({stage: 'task_exp'});
      var cue_data = task_trials.select('cue_shape').values;
      var rt_data = task_trials.select('rt').values;
      var acc_data = task_trials.select('correct').values;

      // record proportion correct as unstructured data
      psiturk.recordUnstructuredData("bonus", jsPsych.data.get()
                                     .filter([{stimulus_type: 'incongruent'},
                                              {stimulus_type: 'congruent'},
                                              {stimulus_type: 'unrelated'}])
                                     .select('correct')
                                     .mean()
                                     .toFixed(2));

      */



      // save data
      psiturk.saveData({
          success: function() {
            psiturk.completeHIT();

              /*

              // upon saving, add proportion correct as a bonus (see custom.py) and complete HIT
              psiturk.computeBonus("compute_bonus", function(){
                  psiturk.completeHIT();
              });

              */


          }
      });




    },
});
