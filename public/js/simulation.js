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
};

var radius = 10;

var simulation_loop = false;

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

    for (var i = 0; i < population.length; i+=2) {
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
            console.log(population[i+1].fitness);
        }
    }

    // if an odd number, then the last organism gets left off. draw it, though.
    if (population.length % 2 !== 0) {
        population[population.length - 1].draw(context);
    }

    // use a roulette wheel strategy to pick offspring. a naive O(n) implementation
    var total_fitness = 0;
    for (var i = 0; i < population.length; i++) {
    	total_fitness += population[i].fitness;
    }

    var new_population = [];
    for (var i = 0; i < population.length; i++) {
        var selection = Math.random() * total_fitness;
        for (var j = 0; j < population.length; j++) {
            selection -= population[j].fitness;
            if (selection <= 0) {
                var c = population[j] instanceof Cooperator ? Cooperator : Defector;
                new_population.push(new c(population[i].xposition, population[i].yposition, parameters['starting_fitness']));
                break;
            }
        }
    }

    simulation_loop = setTimeout(function() { runSimulation(new_population); }, parameters.delay);
}


$(function() {
        var pageHeight = $(window).height();
        var pageWidth = $(window).width();
        var divHeight = $('#top').height();
    $('#rest').html($('<canvas id="simulation" width="' + pageWidth + '" height="' + (pageHeight - divHeight - 10)  + '">'));


    for (i in parameters) {
        $('#' + i).val(parameters[i]);
    }

    $('form').submit(function(){
        return false;
    });

    $('#run_simulation').on('click', function() {

        // end a simulation
        if (simulation_loop !== false) {
            clearTimeout(simulation_loop);
            simulation_loop = false;

            for (i in parameters) {
                $('#' + i).prop('disabled', false);
            }

            $('#run_simulation').text('Run');
            return false;
        }

        // TODO: error check numbers
        for (i in parameters) {
            parameters[i] = parseFloat($('#' + i).val());
            $('#' + i).prop('disabled', true);
        }

        var population = [];

        var num_cooperators = Math.floor(parameters['num_organisms'] * parameters['cooperator_fraction']);

        var width = $('#simulation').width();
        var height = $('#simulation').height();
        for (var i = 0; i < parameters['num_organisms']; i++) {
            var x = Math.random() * (width - 2 * radius) + radius;
            var y = Math.random() * (height - 2 * radius) + radius;
            var o = new (i < num_cooperators ? Cooperator : Defector)(x, y, parameters['starting_fitness']);
            population.push(o);
        }

        $('#run_simulation').text('Stop');

        runSimulation(population);
    });
});
