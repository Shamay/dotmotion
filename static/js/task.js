/* load psiturk */
var psiturk = new PsiTurk(uniqueId, adServerLoc, mode);

//The main timeline to be fed into jsPsych.init
var timeline = [];

// Loading config and trial data file synchronously
var config, headers, lines;

$.ajax({
  url: '/static/js/config.json',
  async: false,
  dataType: 'json',
  success: function (response) {
    config = response[0]
  }
});

$.ajax({
    url: "/static/trial_data/practice_trials.csv",
    async: false,
    dataType: "text",
    success: function (response) {
      processData(response, 1);
    }
 });

 $.ajax({
     url: "/static/trial_data/effortGroup_1_sequence1.csv",
     async: false,
     dataType: "text",
     success: function (response) {
       processData(response, 2);
     }
  });

// read csv files
function processData(allText, option) {
    var allTextLines = allText.split(/\r\n|\n/);

    if(option == 1){
      prc_headers = allTextLines[0].split(',');
      prc_lines = [];
    }else if(option == 2){
      exp_headers = allTextLines[0].split(',');
      exp_lines = [];
    }

    for (var i=1; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if(option == 1){

          if (data.length == prc_headers.length) {
              var tarr = [];
              for (var j=0; j<prc_headers.length; j++) {
                  tarr.push(data[j]);
              }
              prc_lines.push(tarr);
          }
        }else if(option == 2){
          if (data.length == exp_headers.length) {
              var tarr = [];
              for (var j=0; j<exp_headers.length; j++) {
                  tarr.push(data[j]);
              }
              exp_lines.push(tarr);
          }
        }
    }
}

// fullscreen mode
/*
timeline.push({
  type: 'fullscreen',
  fullscreen_mode: true,
  message: '<p>The experiment will switch to full screen mode when you press the button below</p>',
  button_label: 'Start Experiment'
});
*/


//---------Create trials---------
var cue = {
  type: 'html-keyboard-response',
  stimulus: '',
  choices: jsPsych.NO_KEYS,

  phase: jsPsych.timelineVariable('phase'),
  task: jsPsych.timelineVariable('task'),
  cue_shape: jsPsych.timelineVariable('cue_shape'),

  trial_duration: config.cue_duration, //Duration of each cue in ms

  data: jsPsych.timelineVariable('data'),

  on_start: function(cue){
    if(typeof cue.cue_shape === "undefined"){
      cue.stimulus = "<div style='float: center;'><img src='/static/images/circle.png'></img></div>";
    }else{
      if(cue.phase == '3'){
        cue.stimulus = "<div style='width: 700px;'>" +
           "<div style='float: center;'><img src='/static/images/" + cue.cue_shape + ".png'></img></div>" +
        "(this cues a " + cue.task + " task)</div>";
        cue.trial_duration = cue.trial_duration + 2000;
      }else{
        cue.stimulus = "<div style='float: center;'><img src='/static/images/" + cue.cue_shape + ".png'></img></div>";
      }
    }
  }
}

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
    if(config.task_feedback){
      if(fixation.phase == '1.1' || fixation.phase == '1.2' || fixation.phase == '3'){
        if(typeof data.correct === "undefined"){
          fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
        }else if(data.correct){
          fixation.prompt = '<div style="color:#1FAC65;font-size:30px"; class = center-text><b>Correct!</b>'+
          '</div><p style="color:grey;">Filler</p><p style="color:grey;font-size:12px">Filler</p>';
        }else if(!data.correct){
          if(data.task == 'motion'){
            if(data.correct_choice == 'a'){
              fixation.prompt = '<div style="color:#DA1802;font-size:30px"; class = center-text><b>Incorrect</b>' +
              '</div><p>Press A for mostly upward motion.</p><p style="color:grey;font-size:12px">Filler</p>';
            }else if(data.correct_choice == 'l'){
              fixation.prompt = '<div style="color:#DA1802;font-size:30px"; class = center-text><b>Incorrect</b>' +
              '</div><p>Press L for mostly downward motion.</p><p style="color:grey;font-size:12px">Filler</p>';
            }
          }else if(data.task == 'color'){
            if(data.correct_choice == 'a'){
              fixation.prompt = '<div style="color:#DA1802;font-size:30px"; class = center-text><b>Incorrect</b>' +
              '</div><p>Press A for mostly blue dots.</p><p style="color:grey;font-size:12px">Filler</p>';
            }else if(data.correct_choice == 'l'){
              fixation.prompt = '<div style="color:#DA1802;font-size:30px"; class = center-text><b>Incorrect</b>' +
              '</div><p>Press L for mostly red dots.</p><p style="color:grey;font-size:12px">Filler</p>';
            }
          }
          fixation.trial_duration = fixation.trial_duration + 3000;
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

    // dynamically change inter_trial_interval
    if(data.response_ends_trial && data.fill_ITT && data.rt != -1){
      fixation.trial_duration += Math.floor(data.trial_duration - data.rt);
    }
  }
}

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
  motionCoherence:  jsPsych.timelineVariable('motionCoherence'),
  colorCoherence: jsPsych.timelineVariable('colorCoherence'),
  data: jsPsych.timelineVariable('data'),

  number_of_dots: config.number_of_dots, //Total number of dots in the aperture
  trial_duration: jsPsych.timelineVariable('trial_duration'), //Duration of each trial in ms
  dot_timeout: jsPsych.timelineVariable('dot_timeout'),

  response_ends_trial: config.response_ends_trial, //Whether response ends the trial or not
  fill_ITT: config.fill_ITT, // Whether to standardize trial length or not, condition on response_ends_trial being true
  text: jsPsych.timelineVariable('text'),

  on_start: function(stimulus){
    var data = jsPsych.data.get().last(2).values()[0];
    console.log(data)

    if(stimulus.phase == '1.1'){
      // update coherence
      if(typeof data.correct === "undefined"){
        currentMotionCoherence = currentMotionCoherence + (2*learningRate - 0.002);
      }else if(data.correct){
        if(currentMotionCoherence > minCoherence){
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
      console.log(stimulus.motionCoherence);

    }else if(stimulus.phase == '1.2'){
      // update coherence
      if(typeof data.correct === "undefined"){
        currentColorCoherence = currentColorCoherence + (2*learningRate - 0.002);
      }else if(data.correct){
        if(currentColorCoherence > minCoherence){
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
      console.log(currentColorCoherence);

    }
  }
}

//convert vertical/horizontal to degree notation
var degrees;
if (config.coherentAxis ==  'verticalAxis'){
  degrees = 270;
}else if (config.coherentAxis ==  "horizontalAxis") {
  degrees = 180;
}

var motion_stimulus = [
  {// Motion trial 1
    phase: '1.1',
    task: 'motion',
    correct_choice: 'l', //The correct answer for Condition 2
    coherent_direction: degrees, //The coherent direction for Condition 1 (dots move down/left)
    coherent_color: 'blue'
  },
  {// Motion trial 2
    phase: '1.1',
    task: 'motion',
    correct_choice: 'a', //The correct answer for Condition 2
    coherent_direction: degrees - 180, //The coherent direction for Condition 2 (dots move up/right)
    coherent_color: 'red'
  },{// Motion trial 3
    phase: '1.1',
    task: 'motion',
    correct_choice: 'l', //The correct answer for Condition 2
    coherent_direction: degrees, //The coherent direction for Condition 1 (dots move down/left)
    coherent_color: 'red'
  },
  {// Motion trial 4
    phase: '1.1',
    task: 'motion',
    correct_choice: 'a', //The correct answer for Condition 2
    coherent_direction: degrees - 180, //The coherent direction for Condition 2 (dots move up/right)
    coherent_color: 'blue'
  }
]

var color_stimulus = [
  {// Color trial 1
    phase: '1.2',
    task: 'color',
    correct_choice: 'l',
    coherent_direction: degrees,
    coherent_color: 'red'
  },
  {// Color trial 2
    phase: '1.2',
    task: 'color',
    correct_choice: 'a',
    coherent_direction: degrees - 180,
    coherent_color: 'blue'
  },{// Color trial 3
    phase: '1.2',
    task: 'color',
    correct_choice: 'l',
    coherent_direction: degrees - 180,
    coherent_color: 'red'
  },
  {// Color trial 4
    phase: '1.2',
    task: 'color',
    correct_choice: 'a',
    coherent_direction: degrees,
    coherent_color: 'blue'
  }
]

// --------------------
// FIRST PHASE
// --------------------
//staircasing phase
var numTrials = 10;
var currentMotionCoherence = 0.73;
var currentColorCoherence = 0.73;
var learningRate = 0.011;
var minCoherence = 0.52;
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
      '<li><b>Phase 3:</b> you will practice switching between color or motion tasks.</li>' +
      '<li><b>Phase 4:</b> you will be cued to switch between color or motion tasks.</p></li></ul></div>' +
      '<p>Click next to continue.</p>',
      "<div style='font-size:32px'>Welcome to the <strong>Phase 1</strong>.</div></br>" +
      "<div style='font-size:24px'>Let's learn about the <u>stimulus</u>.</div>" +
      "<p>A swarm of red and blue moving dots will be moving on the screen.</p>" +
      "<p>Click next for an example.</p>"
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
    coherent_direction: degrees,
    coherent_color: 'blue',
    trial_duration: 3000
  }],
}
timeline.push(stim_example);


/* define instructions block */
var instructions_motion = {
  type: 'instructions',
  pages: ["<p>Now that you've seen the stimulus, there are two sets of tasks:</p>"+
          "<div style='font-size:24px'><strong><u>Motion</u></strong> tasks and <strong><u>Color</u></strong> tasks </div>",

      "<div style='font-size:32px'>Motion Instructions</div>" +
      "<p>In the <strong>motion</strong> task, you must figure out which direction the majority of the dots are going.</p>" +
      "<div class='row'>" +
        "<div class='column' style='float:center; border-style: solid;'>If most of the dots are going <strong>upward</strong>,</br>" +
        "press the <u>A key</u> as fast as you can.</br></br><img src='/static/images/up.png'></img>" +
        "</br></br><strong>Press A for majority up</strong></div>" +
        "<div class='column' style='float:center; border-style: solid;'>If most of the dots are going <strong>downward</strong>,</br>"+
        "press the <u>L key</u> as fast as you can.</br></br><img src='/static/images/down.png'></img>" +
        "</br></br><strong>Press L for majority down</strong></div>" +
      "</div></br>Press next for an example of each."],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_color = {
  type: 'instructions',
  pages: ["<div style='font-size:32px'>Color Instructions</div>" +
  "<p>In the <strong>color</strong> task, you must figure out the color of the majority of the dots.</p>" +
      "<div class='row'>" +
        "<div class='column' style='float:center; border-style: solid;'>If most of the dots are <strong>blue</strong>,</br>" +
        "press the <u>A key</u> as fast as you can.</br></br><img src='/static/images/blue.png'></img>" +
        "</br></br><strong>Press A for majority blue</strong></div>" +
        "<div class='column' style='float:center; border-style: solid;'>If most of the dots are <strong>red</strong>,</br>"+
        "press the <u>L key</u> as fast as you can.</br></br><img src='/static/images/red.png'></img>" +
        "</br></br><strong>Press L for majority red</strong></div>" +
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
      "You only have 3 seconds to respond on each trial.</br></br>"+
      "Press next to see the instructions for the motion block!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_motion_block = {
  type: 'instructions',
  pages: ["<div style='font-size:32px'>Motion Block</div></br>" +
      "In this block, you will focus on MOTION.</br></br>" +
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
      "In this block, you will focus on COLOR.</br></br>" +
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
    coherent_direction: degrees,
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
    coherent_direction: degrees+180,
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
    coherent_direction: degrees,
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
    coherent_direction: degrees,
    coherent_color: 'blue',
    text: 'Majority Blue (Press A)',
    trial_duration: 3000
  }],
}

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

// staircasing trials
var motion_stimulus_stc = motion_stimulus;
var color_stimulus_stc = color_stimulus;
for(i = 0; i < motion_stimulus.length; i++){
  motion_stimulus_stc[i]['trial_duration'] = 3000;
  motion_stimulus_stc[i]['dot_timeout'] = 1500;
  color_stimulus_stc[i]['trial_duration'] = 3000;
  color_stimulus_stc[i]['dot_timeout'] = 1500;
}

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

// --------------------
// SECOND PHASE
// --------------------
var trial_counter = 0;
if (trial_counter == 0) {var sum = 0;}
var response_array = [];
var end_phase = false;
var maxTrials = 100;

var shapes = [["circle","triangle"],["diamond","square"]];
var shuffleShapes = jsPsych.randomization.repeat([0,1], 1);
var mapping = {
  1: shapes[shuffleShapes[0]][0],
  2: shapes[shuffleShapes[0]][1],
  3: shapes[shuffleShapes[1]][0],
  4: shapes[shuffleShapes[1]][1]
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
var instructions_cue2 = {
  type: 'instructions',
  pages: [
    "<p>To cue the <strong>motion</strong> task, you will be shown one of the two cues below.</p>" +
      "<div class='row'>"+
        "<div class='column' style='float: left; border-style: solid; border-right: 0;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[1]+" cues motion task</br>(UP or DOWN)</strong></p></div>" +
        "<div class='column' style='float: right; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[2]+" cues motion task</br>(UP or DOWN)</strong></p></div>" +
      "</div></br>In other words, after you see one of these cues,</br>you will decide whether the majority of dots are going UP or DOWN.",
    "<p>To cue the <strong>color</strong> task, you will be shown one of the two cues below.</p>" +
      "<div class='row'>"+
        "<div class='column' style='float:center; border-style: solid; border-right: 0;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[3]+" cues color task</br>(RED or BLUE)</strong></p></div>" +
        "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[4]+" cues color task</br>(RED or BLUE)</strong></p></div>" +
      "</div></br>In other words, after you see one of these cues,</br>you will decide whether the majority of dots are RED or BLUE.",
      "You will be doing a training task where it will show you a cue,</br>"+
      "and you will have to respond whether it corresponds to a</br>" +
      "</b>motion</b> task (press Q) or a </b>color</b> task (press P).</br></br>" +
      "Remember:</br></br> Motion task cue -> Press Q</br>Color task cue -> Press P</br></br>"+
      "Click next to review the cues.",
    "<div style='font-size:24px'>Let's practice associating cues and their tasks.</div>" +
        "<div class='row'>"+
          "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[1]+" cues motion</br>(Press Q)</strong></p></div>" +
          "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[2]+" cues motion</br>(Press Q)</strong></p></div>" +
        "</div>" +
        "<div class='row'>"+
          "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[3]+" cues color</br>(Press P)</strong></p></div>" +
          "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[4]+" cues color</br>(Press P)</strong></p></div>" +
        "</div>" +
      "Please ready your fingers on the Q and P keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var instructions_cue3 = {
  type: 'instructions',
  pages: [
    "Now that you've gotten a chance to practice, you have to do the same task without any hints.</br></br>" +
    "In order to proceed, you will need to get 18 out of the previous 20 trials correct.</br>" +
    "To move on, you have to <b><u>memorize</u></b> whether a cue corresponds to motion or color!</br></br>"+
    "Click next to review the cues again. Please memorize them!",
  "<div style='font-size:24px'>Try your best to memorize these cues and their tasks.</div>" +
      "<div class='row'>"+
        "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[1]+" cues motion</br>(Press Q)</strong></p></div>" +
        "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[2]+" cues motion</br>(Press Q)</strong></p></div>" +
      "</div>" +
      "<div class='row'>"+
        "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[3]+" cues color</br>(Press P)</strong></p></div>" +
        "<div class='column' style='float:center; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
        "<p class='small'><strong>"+mapping[4]+" cues color</br>(Press P)</strong></p></div>" +
      "</div>" +
    "Please ready your fingers on the Q and P keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

var cue_phase = {
  type: "html-keyboard-response",
  stimulus: jsPsych.timelineVariable('stimulus'),
  choices: ['p', 'q'],
  data: jsPsych.timelineVariable('data'),
  trial_duration: config.trial_duration + 1000,
  on_start: function(cue_phase){
    if(cue_phase.data.practice != 0){
      cue_phase.trial_duration = cue_phase.trial_duration + 3000;
    }
  },
  on_finish: function(data){
    if(data.key_press == null){
      data.correct == null;
    }else{
      data.correct = data.key_press == jsPsych.pluginAPI.convertKeyCharacterToKeyCode(data.correct_choice);
    }
  }
}

var cue_response = {
  type: "html-keyboard-response",
  stimulus: jsPsych.timelineVariable('stimulus'),
  choices: jsPsych.NO_KEYS,
  trial_duration: config.feedback_duration + 300, //Duration of each cue in ms
  trial_data: jsPsych.timelineVariable('data'),
  on_start: function(cue_response){
    // get data from previous trial
    var data = jsPsych.data.get().last(1).values()[0];

    if(cue_response.trial_data.practice != 0){
      cue_response.trial_duration = cue_response.trial_duration + 2000;
    }else{
      trial_counter += 1;
      if(data.correct){
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
      console.log(data.cue, data.key_press, data.correct, trial_counter, sum);

      //every fifth trial, give them time to read number of trials left
      if(cue_response.stimulus.charAt(5) == 'c'){
        cue_response.trial_duration = cue_response.trial_duration + 2250;
      }
    }
    cue_response.stimulus = generateCue(data.cue, data.practice, data.key_press, data.correct, trial_counter);
  }
}

var cue_fixation = {
  type: 'html-keyboard-response',
  stimulus: '<div style="float: center; font-size:60px; color:black;">+</div>',
  choices: jsPsych.NO_KEYS,
  trial_duration: config.inter_trial_interval
}

function generateCue(cue, practice = 0, answer = '', correct = true, trial_counter){
  var response = null;
  if(answer == null){
    response = "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
              "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
           "</div>" +
           "<div style='height: 158.667px'>" +
              "<div style='justify-content: center; display: flex; font-size:30px;" +
              "height: 158.667px; align-items: center;'>Respond Faster!</div>" +
           "</div>"  +
           "<div style='width: 700px; height: 100px;'>" +
              "<div style='float: center; color: grey'>Filler</div>" +
           "</div>"
  }else if(answer == jsPsych.pluginAPI.convertKeyCharacterToKeyCode('q')){
      if(correct){
        response = "<div class='column' style='border:3px solid green'>" +
                  "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
                  "<div class='column' style='border:3px solid grey'>" +
                  "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
               "</div>" +
               "<div>" +
                  "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
               "</div>" +
               "<div style='width: 700px; height: 100px;'>" +
                  "<div style='float: center; color: grey'>Filler</div>" +
               "</div>"
      }else{
        response = "<div class='column' style='border:3px solid red'>" +
                  "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
                  "<div class='column' style='border:3px solid grey'>" +
                  "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
               "</div>" +
               "<div>" +
                  "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
               "</div>" +
               "<div style='width: 700px; height: 100px;'>" +
                  "<div style='float: center; color: grey'>Filler</div>" +
               "</div>"
      }
  }else if(answer == jsPsych.pluginAPI.convertKeyCharacterToKeyCode('p')){
    if(correct){
      response = "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
                "<div class='column' style='border:3px solid green'>" +
                "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
             "</div>" +
             "<div>" +
                "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
             "</div>"   +
             "<div style='width: 700px; height: 100px;'>" +
                "<div style='float: center; color: grey'>Filler</div>" +
             "</div>"
    }else{
      response = "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
                "<div class='column' style='border:3px solid red'>" +
                "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
             "</div>" +
             "<div>" +
                "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
             "</div>"   +
             "<div style='width: 700px; height: 100px;'>" +
                "<div style='float: center; color: grey'>Filler</div>" +
             "</div>"
    }
  }else{
    response = "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
              "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
           "</div>" +
           "<div>" +
              "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
           "</div>"  +
           "<div style='width: 700px; height: 100px;'>" +
              "<div style='float: center; color: grey'>Filler</div>" +
           "</div>"
  }

  if(practice != 0){
    if(practice == 1){
      return "<div style='color:white'; class='row'>The "+ mapping[1] +" cues a motion task, so press Q.</div><div class='row'>" + response;
    }else if(practice == 2){
      return "<div style='color:white'; class='row'>The "+ mapping[2] +" cues a motion task, so press Q.</div><div class='row'>" + response;
    }else if(practice == 3){
      return "<div style='color:white'; class='row'>The "+ mapping[3] +" cues a color task, so press P.</div><div class='row'>" + response;
    }else if(practice == 4){
      return "<div style='color:white'; class='row'>The "+ mapping[4] +" cues a color task, so press P.</div><div class='row'>" + response;
    }
  }else{
    if(answer != null && trial_counter % 5 == 0){
      return "<div class='row'>" +
             "You need "+ (18-sum) + " more correct trials to move on!</div>"+
             "<div class='row'>" + response;
    }else{
      return "<div style='color:grey'; class='row'>-</div><div class='row'>" + response;
    }
  }


}

var cue_stimuli_practice = [
  { stimulus: generateCue(mapping[1], practice = 1), data: {task: 'motion', cue: mapping[1], correct_choice: 'q', practice: 1}},
  { stimulus: generateCue(mapping[2], practice = 2), data: {task: 'motion', cue: mapping[2], correct_choice: 'q', practice: 2}},
  { stimulus: generateCue(mapping[3], practice = 3), data: {task: 'color', cue: mapping[3], correct_choice: 'p', practice: 3}},
  { stimulus: generateCue(mapping[4], practice = 4), data: {task: 'color', cue: mapping[4], correct_choice: 'p', practice: 4}}
];

var cue_stimuli = [
  { stimulus: generateCue(mapping[1]), data: {task: 'motion', cue: mapping[1], correct_choice: 'q', practice: 0}},
  { stimulus: generateCue(mapping[2]), data: {task: 'motion', cue: mapping[2], correct_choice: 'q', practice: 0}},
  { stimulus: generateCue(mapping[3]), data: {task: 'color', cue: mapping[3], correct_choice: 'p', practice: 0}},
  { stimulus: generateCue(mapping[4]), data: {task: 'color', cue: mapping[4], correct_choice: 'p', practice: 0}}
];

var cue_practice = {
  timeline: [cue_phase, cue_response, cue_fixation],
  timeline_variables: cue_stimuli_practice,
  randomize_order: true,
  repetitions: 2,
  sample: {
      type: "without-replacement",
      size: 4
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
    '<div style="font-size:24px">We will be switching between color and motion tasks.</div></br>' +
    'The cues you learned earlier will tell you if you </br>'+
    'are supposed to focus on color or motion.</br></br>',
    '<div style="font-size:24px">First, we will focus on the <u>motion</u> cues.</div></br>' +
    'You will see a motion cue (' + mapping[1] + ' or ' + mapping[2] + ')'+
    ' and then complete 4-6 motion tasks.</br></br>' +
    "<b>Remember:</b></br>" +
    "We're coming back to 'A' or 'L' responses.</br>" +
    'A is for majority upward motion.</br>' +
    'L is for majority downward motion.</br></br>' +
    "<b>Also:</b></br>"+
    "You'll no longer be waiting for the '?'.</br>Respond as soon as you know the answer.</br></br>"+
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
    coherent_direction: degrees,
    coherent_color: 'blue',
    text: 'Motion Task - Down (Press L)',
    trial_duration: 4000,
    cue_shape: mapping[1],
    phase: 3
  }],
}

var practice_example2 = {
  timeline: [stimulus,fixation],
  timeline_variables: [{
    task: 'motion',
    correct_choice: 'a',
    coherent_direction: degrees + 180,
    coherent_color: 'blue',
    text: 'Motion Task - Up (Press A)',
    trial_duration: 4000,
    phase: 3
  }],
}

var practice_example3 = {
  timeline: [stimulus,fixation],
  timeline_variables: [{
    task: 'motion',
    correct_choice: 'l',
    coherent_direction: degrees,
    coherent_color: 'red',
    text: 'Motion Task - Down (Press L)',
    trial_duration: 4000,
    phase: 3
  }],
}

var instructions_prc2 = {
  type: 'instructions',
  pages: [
    '<div style="font-size:24px">Great! Now we will focus on the <u>color</u> cues.</div></br>' +
    'You will see a color cue (' + mapping[3] + ' or ' + mapping[4] + ')'+
    ' and then complete 4-6 color tasks.</br></br>' +
    "<b>Remember:</b></br>" +
    "We're coming back to 'A' or 'L' responses.</br>" +
    'A is for majority blue dots.</br>' +
    'L is for majority red dots.</br></br>' +
    "<b>Also:</b></br>"+
    "You'll no longer be waiting for the '?'.</br>Respond as soon as you know the answer.</br></br>"+
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
    coherent_direction: degrees,
    coherent_color: 'blue',
    text: 'Color Task - Blue (Press A)',
    trial_duration: 4000,
    cue_shape: mapping[3],
    phase: 3
  }],
}

var practice_example5 = {
  timeline: [stimulus,fixation],
  timeline_variables: [{
    task: 'color',
    correct_choice: 'l',
    coherent_direction: degrees,
    coherent_color: 'red',
    text: 'Color Task - Red (Press L)',
    trial_duration: 4000,
    phase: 3
  }],
}

var practice_example6 = {
  timeline: [stimulus,fixation],
  timeline_variables: [{
    task: 'color',
    correct_choice: 'a',
    coherent_direction: degrees + 180,
    coherent_color: 'blue',
    text: 'Color Task - Blue (Press A)',
    trial_duration: 4000,
    phase: 3
  }],
}

var instructions_prc3 = {
  type: 'instructions',
  pages: [
    "<div style='font-size:24px'>Fantastic! Now you'll begin Phase 3.</div></br>" +
    "Just like in Phase 1, you will have a block of trials, but now we will add cues. </br>" +
    "Before each set of trials you will see a cue that indicates " +
    "the current task to be performed.</br>",
    'You will have a cue and then 4-6 trials before getting to another cue.</br></br>' +
    'Do the same task for all the subsequent trials until you get a new cue: </br></br>'+
    "Example: </br>" +
    "<b>"+mapping[1]+" cue</b> -> motion task -> motion task -> motion task -> motion task -> motion task -> </br> " +
    "<b>"+mapping[3]+" cue</b> -> color task -> color task -> color task -> color task -> </br>" +
    "<b>"+mapping[4]+" cue</b> -> color task -> color task -> color task ...</br></br>" +
    'Click next to review the cues again.',
    "<div style='font-size:24px'>Here are the cues and the tasks they indicate:</div>" +
        "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid; border-right: 0;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[1]+" cues motion</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[2]+" cues motion</br></strong></p></div>" +
        "</div>" +
        "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid; border-right: 0;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[3]+" cues color</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[4]+" cues color</br></strong></p></div>" +
        "</div></br>",
      "<div style='font-size:24px'>Some reminders before you begin:</div></br>" +
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
timeline.push(practice_example1);
timeline.push(practice_example2);
timeline.push(practice_example3);
timeline.push(practice_example3);
timeline.push(practice_example2);

timeline.push(instructions_prc2);
timeline.push(practice_example4);
timeline.push(practice_example5);
timeline.push(practice_example6);
timeline.push(practice_example6);
timeline.push(practice_example5);

timeline.push(instructions_prc3);

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
    coherent_direction = degrees - 180;
  }else if(vars[2] == 2){
    coherent_direction = degrees;
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
      motionCoherence: currentMotionCoherence,
      coherent_color: coherent_color,
      colorCoherence: currentColorCoherence,

      data: {task_transition: task_transition,
            cue_transition: cue_transition,
            response_transition: response_transition,
            miniblock_size: miniblock_size,
            miniblock_trial: miniblock_trial,
            miniblock: miniblock,
            block: block}
    }];
}

for (line in prc_lines){
  var trial_vars_prc = generateTrials(prc_lines[line], '3'); //generate timeline variables

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
      "The format is the same as Phase 3, but with no hints or feedback.</br></br>" +
      "In other words, you have to remember which cues refer to motion and color</br>" +
      "AND you won't be told whether you got the trial correct or not! </br></br>" +
      'Click next to review the cues again.',
      "<div style='font-size:24px'>Here are the cues and the tasks they indicate:</div>" +
          "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid; border-right: 0;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[1]+" cues motion</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[2]+" cues motion</br></strong></p></div>" +
          "</div>" +
          "<div class='row'>"+
          "<div class='column' style='float:left; border-style: solid; border-right: 0;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[3]+" cues color</br></strong></p></div>" +
          "<div class='column' style='float:right; border-style: solid;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
          "<p class='small'><strong>"+mapping[4]+" cues color</br></strong></p></div>" +
          "</div>",
        "<div style='font-size:24px'>Some reminders before you begin:</div></br>" +
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


for (line in exp_lines){
  var trial_vars_exp = generateTrials(exp_lines[line], '4'); //generate timeline variables
  // pause before block two
  if(trial_vars_exp[0].data.block == 2){
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



//---------Run the experiment---------

//Initiate the experiment
/*jsPsych.init({
  timeline: timeline,
  //show_progress_bar: true,
  on_finish: function(){ //Execute this when the experiment finishes
    //jsPsych.data.localSave('testSave.csv', 'csv'); //Save the data locally in a .csv file
    jsPsych.data.displayData(); //Display the data onto the browser screen

    //jsPsych.data.getInteractionData(); LOOK INTO THIS

    // select task trials
    var task_trials = jsPsych.data.get().filter({stage: 'task_exp'});
    var cue_data = task_trials.select('cue_shape').values;
    var rt_data = task_trials.select('rt').values;
    var acc_data = task_trials.select('correct').values;

    outputData(cue_data,rt_data,acc_data);
  }
})*/

// record id, condition, counterbalance on every trial
jsPsych.data.addProperties({
    uniqueId: uniqueId,
    condition: condition,
    counterbalance: counterbalance
});

jsPsych.init({
    //display_element: 'jspsych-target',
    timeline: timeline,
    // record data to psiTurk after each trial
    on_data_update: function(data) {
        //psiturk.recordTrialData(data);
    },
    on_finish: function() {
      jsPsych.data.displayData(); //Display the data onto the browser screen



      // record proportion correct as unstructured data
      psiturk.recordUnstructuredData("bonus", jsPsych.data.get()
                                     .filter([{stimulus_type: 'incongruent'},
                                              {stimulus_type: 'congruent'},
                                              {stimulus_type: 'unrelated'}])
                                     .select('correct')
                                     .mean()
                                     .toFixed(2));
      // save data
      psiturk.saveData({
          success: function() {
              // upon saving, add proportion correct as a bonus (see custom.py) and complete HIT
              psiturk.computeBonus("compute_bonus", function(){
                  psiturk.completeHIT();
              });
          }
      });




    },
});
