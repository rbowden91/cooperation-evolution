// default values for all possible parameters
var parameters = {
    'benefit' : 10,
    'cost' : 10,
    'interactions' : 0,
    'num_organisms' : 50,
    'cooperator_fraction' : .5,
    'delay': 1000,
    'repeat_probability' : .5,
    'starting_fitness' : 100,
    'population_refresh' : 0
};

var radius = 10;

var simulationLoop = false;

function Organism(xposition, yposition, fitness, color) {
    this.xposition = xposition;
    this.yposition = yposition;
    this.fitness = fitness;
    this.color = color;
}

Organism.prototype.draw = function(context) {
    context.beginPath();
    context.fillStyle = this.color;
    context.arc(this.xposition,this.yposition,radius,0,2*Math.PI);
    context.fill();
};

function Cooperator(xposition, yposition, fitness) {
    Organism.call(this, xposition, yposition, fitness, 'blue');
}
Cooperator.prototype = new Organism();

function Defector(xposition, yposition, fitness) {
    Organism.call(this, xposition, yposition, fitness, 'red');
}
Defector.prototype = new Organism();



function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function runSimulation(population) {
    population = shuffle(population);

    var canvas = document.getElementById("simulation");
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < population.length / 2; i++) {
	population[i].draw(context);
	population[i+1].draw(context);

	if (population[i] instanceof Cooperator && population[i+1] instanceof Defector) {
	    population[i + 1].fitness += parameters['benefit'];
	    population[i].fitness -= parameters['cost'];
	}
	else if (population[i] instanceof Defector && population[i+1] instanceof Cooperator) {
	    population[i].fitness += parameters['benefit'];
	    population[i + 1].fitness -= parameters['cost'];
	}
	else if (population[i] instanceof Cooperator && population[i+1] instanceof Cooperator) {
	    do {
		population[i + 1].fitness += parameters['benefit'];
		population[i].fitness -= parameters['cost'];
	    } while (Math.random() < parameters['repeat_probability']);
	}
    }

    requestAnimationFrame(function() { runSimulation(population) });
    //simulationLoop = setTimeout(function() { runSimulation(population); }, parameters.sleep);
}


$(function() {
    for (i in parameters) {
    	$('#' + i).val(parameters[i]);
    }

    $('form').submit(function(){
        return false;
    });

    $('#run_simulation').on('click', function() {

    	// end a simulation
	if (simulationLoop !== false) {
	    clearTimeout(simulationLoop);
	    simulationLoop = false;

	    for (i in parameters) {
		$('#' + i).prop('disabled', false);
	    }

	    $('#run_simulation').text('Run');
	    return false;
	}

    	// TODO: error check numbers
    	for (i in parameters) {
    	    parameters[i] = $('#' + i).val();
	    $('#' + i).prop('disabled', true);
	}

	var population = [];

	var num_cooperators = Math.floor(parameters['num_organisms'] * parameters['cooperator_fraction']);

	var width = $('#simulation').width();
	var height = $('#simulation').height();
	for (var i = 0; i < parameters['num_organisms']; i++) {
	    // XXX wildly inefficient -- find somewhere to place the organism
	    var too_close = true;
	    while (too_close) {
	    	too_close = false;
		var x = Math.random() * (width - 2 * radius) + radius;
		var y = Math.random() * (height - 2 * radius) + radius;
		for (var j = 0; j < population.length; j++) {
		    if (Math.pow(population[j].xposition - x, 2) + Math.pow(population[j].yposition - y, 2) <
		    	Math.pow(radius * 4, 2))
		    	too_close = true;
		    	break;
		}
	    }
	    var o = new (i < num_cooperators ? Cooperator : Defector)(x, y, parameters['starting_fitness']);
	    population.push(o);
	}

	$('#run_simulation').text('Stop');

	runSimulation(population);
    });
});