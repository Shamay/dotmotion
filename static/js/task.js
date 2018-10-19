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
    url: "/static/data.csv",
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

  on_start: function(cue){
    if(typeof cue.cue_shape === "undefined"){
      cue.stimulus = "<div style='width: 700px;'>" +
         "<div style='float: center;'><img src='/static/images/circle.png'></img></div>" +
      "</div>";
    }else{
      if(cue.phase == '3'){
        cue.stimulus = "<div style='width: 700px;'>" +
           "<div style='float: center;'><img src='/static/images/" + cue.cue_shape + ".png'></img></div>" +
        "(this cues a " + cue.task + " task)</div>";
        cue.trial_duration = cue.trial_duration + 1500;
      }else{
        cue.stimulus = "<div style='width: 700px;'>" +
           "<div style='float: center;'><img src='/static/images/" + cue.cue_shape + ".png'></img></div>" +
        "</div>";
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

  on_start: function(fixation){
    // get data from previous trial
    var data = jsPsych.data.get().last().values()[0];

    // prompt whether the previous trial was correct or not
    if(config.task_feedback){
      if(fixation.phase == '1.1' || fixation.phase == '1.2'){
        if(typeof data.correct === "undefined"){
          fixation.prompt = '<div style="font-size:60px; color:black;">+</div>';
        }else if(data.correct){
          fixation.prompt = '<div class = centerbox><div style="color:green;font-size:60px"; class = center-text>Correct!</div></div>';
        }else if(!data.correct){
          if(data.task == 'motion'){
            if(data.correct_choice == 'a'){
              fixation.prompt = '<div class = centerbox><div style="color:red;font-size:60px"; class = center-text>Incorrect' +
              "</div><p>Press A for mostly downward motion.</p></div>";
            }else if(data.correct_choice == 'l'){
              fixation.prompt = '<div class = centerbox><div style="color:red;font-size:60px"; class = center-text>Incorrect' +
              "</div><p>Press L for mostly upward motion.</p></div>";
            }
          }else if(data.task == 'color'){
            if(data.correct_choice == 'a'){
              fixation.prompt = '<div class = centerbox><div style="color:red;font-size:60px"; class = center-text>Incorrect' +
              "</div><p>Press A for mostly red dots.</p></div>";
            }else if(data.correct_choice == 'l'){
              fixation.prompt = '<div class = centerbox><div style="color:red;font-size:60px"; class = center-text>Incorrect' +
              "</div><p>Press L for mostly blue dots.</p></div>";
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

  number_of_dots: config.number_of_dots, //Total number of dots in the aperture
  trial_duration: jsPsych.timelineVariable('trial_duration'), //Duration of each trial in ms
  dot_timeout: jsPsych.timelineVariable('dot_timeout'),

  response_ends_trial: config.response_ends_trial, //Whether response ends the trial or not
  fill_ITT: config.fill_ITT, // Whether to standardize trial length or not, condition on response_ends_trial being true
  text: jsPsych.timelineVariable('text'),

  on_start: function(stimulus){
    var data = jsPsych.data.get().last(2).values()[0];

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
    correct_choice: 'a', //The correct answer for Condition 2
    coherent_direction: degrees, //The coherent direction for Condition 1 (dots move down/left)
    coherent_color: 'blue'
  },
  {// Motion trial 2
    phase: '1.1',
    task: 'motion',
    correct_choice: 'l', //The correct answer for Condition 2
    coherent_direction: degrees - 180, //The coherent direction for Condition 2 (dots move up/right)
    coherent_color: 'red'
  },{// Motion trial 3
    phase: '1.1',
    task: 'motion',
    correct_choice: 'a', //The correct answer for Condition 2
    coherent_direction: degrees, //The coherent direction for Condition 1 (dots move down/left)
    coherent_color: 'red'
  },
  {// Motion trial 4
    phase: '1.1',
    task: 'motion',
    correct_choice: 'l', //The correct answer for Condition 2
    coherent_direction: degrees - 180, //The coherent direction for Condition 2 (dots move up/right)
    coherent_color: 'blue'
  }
]

var color_stimulus = [
  {// Color trial 1
    phase: '1.2',
    task: 'color',
    correct_choice: 'a',
    coherent_direction: degrees,
    coherent_color: 'red'
  },
  {// Color trial 2
    phase: '1.2',
    task: 'color',
    correct_choice: 'l',
    coherent_direction: degrees - 180,
    coherent_color: 'blue'
  },{// Color trial 3
    phase: '1.2',
    task: 'color',
    correct_choice: 'a',
    coherent_direction: degrees - 180,
    coherent_color: 'red'
  },
  {// Color trial 4
    phase: '1.2',
    task: 'color',
    correct_choice: 'l',
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
      'Welcome to the dot-motion experiment! Click next to continue.',
      "<p>In this experiment, a swarm of red and blue moving dots will be moving on the screen.</p>" +
      "<p>Click next for a moving example.</p>"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};
timeline.push(introduction);
timeline.push(stimulus);


/* define instructions block */
var instructions_motion = {
  type: 'instructions',
  pages: ["<p>Now that you've seen the stimulus, " +
  "there are two sets of tasks:</p> <strong>Motion</strong> tasks and <strong>Color</strong> tasks",

      "<p>In the <strong>motion</strong> task, you must discern which direction the majority of the dots are going.</p>" +
      "<p>If the majority of dots are going <strong>downwards</strong>, " +
      "press the letter A as fast as you can.</br>" +
      "If the majority of dots are going <strong>upwards</strong>, press the letter L " +
      "as fast as you can.</p>" +
      "<div style='width: 700px;'>"+
      "<div style='float: left;'><img src='/static/images/down.png'></img>" +
      "<p class='small'><strong>Press the A key</strong></p></div>" +
      "<div class='float: right;'><img src='/static/images/up.png'></img>" +
      "<p class='small'><strong>Press the L key</strong></p></div>" +
      "</div>",

      "<p>We will begin with just the <strong>motion</strong> task. </br> Remember to " +
      "press A when the majority of the dots are moving down and L for up.</p>" +
      "<p>In the first stage of the experiment, we will slowly increase the difficulty " +
      "of the tasks until we reach an appropriate level.</p>" +
      "Please ready your fingers on the A and L keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

/* define instructions block */
var instructions_color = {
  type: 'instructions',
  pages: ["<p>In the <strong>color</strong> task, you must discern the color of the majority of the dots.</p>" +
      "<p>If the majority of dots are <strong>red</strong>, " +
      "press the letter A as fast as you can.</p>" +
      "<p>If the majority of dots are <strong>blue</strong>, press the letter L " +
      "as fast as you can.</p>" +
      "<div style='width: 700px;'>"+
      "<div style='float: left;'><img src='/static/images/red.png'></img>" +
      "<p class='small'><strong>Press the A key</strong></p></div>" +
      "<div class='float: right;'><img src='/static/images/blue.png'></img>" +
      "<p class='small'><strong>Press the L key</strong></p></div>" +
      "</div>",

      "<p>We will begin with just the <strong>motion</strong> task. </br> Remember to " +
      "press A when the majority of the dots are moving down and L for up.</p>" +
      "<p>Again, we will slowly increase the difficulty " +
      "of the tasks until we reach an appropriate level.</p>" +
      "Please ready your fingers on the A and L keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};

timeline.push(instructions_motion);

var stimulus_example = {
  timeline: [stimulus],
  timeline_variables: [{
    task: 'motion',
    correct_choice: 'a',
    coherent_direction: degrees,
    coherent_color: 'blue',
    text: 'Dots moving down'
  }],
}
timeline.push(stimulus_example);

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

timeline.push(instructions_color);

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
      '<div style="font-size:32px"><p>Welcome to the <strong>Phase 2</strong>. </div></br> Now, we will add a set of cues that appear ' +
      'before each of the two tasks (motion and color).</br>They will indicate which task you are performing.</p>' +
      'Click next for a visual example.'
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};
timeline.push(instructions_cue);
timeline.push(cue, stimulus);

/* define instructions block */
var instructions_cue2 = {
  type: 'instructions',
  pages: [
    "<p> A series of cues will appear on the screen.</br>"+
    "You are asked to match them to the appropriate task (motion or color).</p>",
    "<p>To cue the <strong>motion</strong> task, you will be shown of the two cues below.</p>" +
      "<div style='width: 700px;'>"+
      "<div style='float: left;'><img src='/static/images/" + mapping[1] + ".png'></img>" +
      "<p class='small'><strong>"+mapping[1]+" cues motion (Q)</strong></p></div>" +
      "<div class='float: right;'><img src='/static/images/" + mapping[2] + ".png'></img>" +
      "<p class='small'><strong>"+mapping[2]+" cues motion (Q)</strong></p></div>" +
      "</div>",
    "<p>To cue the <strong>color</strong> task, you will be shown of the two cues below.</p>" +
      "<div style='width: 700px;'>"+
      "<div style='float: left;'><img src='/static/images/" + mapping[3] + ".png'></img>" +
      "<p class='small'><strong>"+mapping[3]+" cues color (P)</strong></p></div>" +
      "<div class='float: right;'><img src='/static/images/" + mapping[4] + ".png'></img>" +
      "<p class='small'><strong>"+mapping[4]+" cues color (P)</strong></p></div>" +
      "</div>",
    "<p> Let's practice associating cues and their tasks.</p>" +
      "<p>Remember to press Q for motion task cues ("+mapping[1]+", "+mapping[2]+") "+
      "and P for color task cues ("+mapping[3]+", "+mapping[4]+").</p>" +
      "Please ready your fingers on the Q and P keys and press next whenever you're ready!"
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};
timeline.push(instructions_cue2);

var cue_phase = {
  type: "html-keyboard-response",
  stimulus: jsPsych.timelineVariable('stimulus'),
  choices: ['p', 'q'],
  data: jsPsych.timelineVariable('data'),
  trial_duration: config.trial_duration,
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
  trial_duration: config.feedback_duration, //Duration of each cue in ms
  on_start: function(cue_response){
    // get data from previous trial
    var data = jsPsych.data.get().last(1).values()[0];
    trial_counter += 1;
    if(data.correct){
      //cue_response.trial_duration = 0;
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
    cue_response.stimulus = generateCue(data.cue, data.key_press, data.correct);
  }
}

var cue_fixation = {
  type: 'html-keyboard-response',
  stimulus: '<div style="float: center; font-size:60px; color:black;">+</div>',
  choices: jsPsych.NO_KEYS,
  trial_duration: config.inter_trial_interval
}

function generateCue(cue, answer = '', correct = true){
  if(answer == null){
    return "<div class='row'>" +
           "You need "+ (18-sum) +" more correct trials to move on!</div><div class='row'>" +
              "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
              "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
           "</div>" +
           "<div style='width: 700px; height: 258.667px'>" +
              "<div style='justify-content: center; display: flex; font-size:60px;" +
              "height: 258.667px; align-items: center;'>Respond Faster!</div>" +
           "</div>"
  }else if(answer == jsPsych.pluginAPI.convertKeyCharacterToKeyCode('q')){
      if(correct){
        return "<div class='row'>"+
                "You need "+ (18-sum) +" more correct trials to move on!</div><div class='row'>" +
                  "<div class='column' style='border:3px solid green'>" +
                  "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
                  "<div class='column' style='border:3px solid grey'>" +
                  "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
               "</div>" +
               "<div style='width: 700px;'>" +
                  "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
               "</div>"
      }else{
        return "<div class='row'>"+
               "You need "+ (18-sum) +" more correct trials to move on!</div><div class='row'>" +
                  "<div class='column' style='border:3px solid red'>" +
                  "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
                  "<div class='column' style='border:3px solid grey'>" +
                  "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
               "</div>" +
               "<div style='width: 700px;'>" +
                  "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
               "</div>"
      }
  }else if(answer == jsPsych.pluginAPI.convertKeyCharacterToKeyCode('p')){
    if(correct){
      return "<div class='row'>"+
             "You need "+ (18-sum) +" more correct trials to move on!</div><div class='row'>" +
                "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
                "<div class='column' style='border:3px solid green'>" +
                "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
             "</div>" +
             "<div style='width: 700px;'>" +
                "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
             "</div>"
    }else{
      return "<div class='row'>"+
             "You need "+ (18-sum) +" more correct trials to move on!</div><div class='row'>" +
                "<div class='column' style='border:3px solid grey'>" +
                "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
                "<div class='column' style='border:3px solid red'>" +
                "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
             "</div>" +
             "<div style='width: 700px;'>" +
                "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
             "</div>"
    }
  }else{
    return "<div style='color:grey'; class='row'>"+
           "-</div><div class='row'>" +
              "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>Motion Trial (Q)</strong></p></div>" +
              "<div class='column' style='border:3px solid grey'>" +
              "<p class='small'><strong>Color Trial (P)</strong></p></div>" +
           "</div>" +
           "<div style='width: 700px;'>" +
              "<div style='float: center;'><img src='/static/images/" + cue + ".png'></img></div>" +
           "</div>"
  }
}

var cue_stimuli = [
  { stimulus: generateCue(mapping[1]), data: {task: 'motion', cue: mapping[1], correct_choice: 'q'}},
  { stimulus: generateCue(mapping[2]), data: {task: 'motion', cue: mapping[2], correct_choice: 'q'}},
  { stimulus: generateCue(mapping[3]), data: {task: 'color', cue: mapping[3], correct_choice: 'p'}},
  { stimulus: generateCue(mapping[4]), data: {task: 'color', cue: mapping[4], correct_choice: 'p'}}
];

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

timeline.push(cue_sequence);

// --------------------
// THIRD PHASE
// --------------------
var instructions_prc = {
  type: 'instructions',
  pages: [
      'Welcome to the THIRD PHASE. Click next to begin the experiment'
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};
timeline.push(instructions_prc);

//generate timeline variables
function generateTrialPractice(vars){
  var cue_select = vars[5];
  var task = vars[4];

  var cue_shape;
  if(task == "motion"){
    if(cue_select == 1){
      cue_shape = mapping[1];
    }else if(cue_select == 2){
      cue_shape = mapping[2];
    }
  }else if(task == "color"){
    if(cue_select == 1){
      cue_shape = mapping[3];
    }else if(cue_select == 2){
      cue_shape = mapping[4];
    }
  }

  var correct_choice;
  if(task == 'motion' && vars[6] == 'up'){
    correct_choice = 'l';
  }else if(task == 'motion' && vars[6] == 'down'){
    correct_choice = 'a';
  }else if(task == 'color' && vars[8] == 'red'){
    correct_choice = 'a';
  }else if(task == 'color' && vars[8] == 'blue'){
    correct_choice = 'l';
  }

  var coherent_direction;
  if(vars[6] == 'up'){
    coherent_direction = degrees - 180;
  }else if(vars[6] == 'down'){
    coherent_direction = degrees;
  }

  var coherent_color;
  if(vars[8] == 'red'){
    coherent_color = 'red';
  }else if(vars[8] == 'blue'){
    coherent_color = 'blue';
  }

  return [{
      phase: '3',
      //id: vars[0],
      //block: vars[1],
      //mblock: vars[2],
      //trial: vars[3],
      task: vars[4],
      cue_shape: cue_shape,
      correct_choice: correct_choice,
      coherent_direction: coherent_direction,
      motionCoherence: vars[7],
      coherent_color: coherent_color,
      colorCoherence: vars[9]
    }];
}

for (line in prc_lines){
  var trial_vars_prc = generateTrialPractice(prc_lines[line]); //generate timeline variables

  if(prc_lines[line][3] == 1){
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
      'Welcome to the FOURTH PHASE. Click next to begin the experiment'
  ],
  show_clickable_nav: true,
  post_trial_gap: 1000
};
timeline.push(instructions_exp);

//generate timeline variables
function generateTrialExp(vars){
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

  var correct_choice; // 1-l (left), 2-a (right)
  if(vars[8] == 1){
    correct_choice = 'l';
  }else if(vars[8] == 2){
    correct_choice = 'a';
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


  return [{
      phase: '4',
      //id: vars[0],
      //block: vars[1],
      //mblock: vars[2],
      //trial: vars[3],
      task: task,
      cue_shape: cue_shape,
      correct_choice: correct_choice,
      coherent_direction: coherent_direction,
      motionCoherence: currentMotionCoherence,
      coherent_color: coherent_color,
      colorCoherence: currentColorCoherence
    }];
}

for (line in exp_lines){
  var trial_vars_exp = generateTrialExp(exp_lines[line]); //generate timeline variables

  if(exp_lines[line][9] == 1){
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
})

function outputData(cue_shape, rt, acc){
  headers.push('rt');
  headers.push('correct');
  headers.push('cue_shape');
  for(line in lines){
    lines[line].push(rt[line]);
    lines[line].push(acc[line]);
    lines[line].push(cue_shape[line]);
  }

  let csv;
  for(let col = 0; col < headers.length; col++){
    csv += headers[col] + ",";
  }
  csv += '\r\n';

  // Loop the array of objects
  for(let row = 0; row < lines.length; row++){
    for(let col = 0; col < headers.length; col++){
      csv += lines[row][col] + ",";
    }
    csv += '\r\n';
  }

  // Once we are done looping, download the .csv by creating a link
  let link = document.createElement('a')
  link.id = 'download-csv'
  link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
  link.setAttribute('download', 'output.csv');
  document.body.appendChild(link)
  document.querySelector('#download-csv').click()
}*/

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
        psiturk.recordTrialData(data);
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
