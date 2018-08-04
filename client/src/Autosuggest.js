import React, { Component } from 'react';
import Autosuggest from 'react-autosuggest';

var getSuggestions = (value, groups) => {
	var inputValue = value.trim().toLowerCase();
	var inputLength = inputValue.length;

	return inputLength === 0 ? [] : groups.filter((group) => 
		group.name.toLowerCase().slice(0, inputLength) === inputValue
	);
};

var getSuggestionValue = (suggestion) => suggestion.name;

var renderSuggestion = (suggestion) => (
	<div>
		{suggestion.name}
	</div>
); //

class GroupSearch extends Component {
	state = {
		value: '',
		suggestions: []
	};

	onChange = (event, { newValue }) => {
    	this.setState({
      		value: newValue
    	});
  	};

	onSuggestionsFetchRequested = ({ value }) => {
		this.setState({ suggestions: getSuggestions(value, this.props.groups)});
	};

	onSuggestionsClearRequested = () => {
		this.setState({ suggestions: [] });
	};

	render() {
		var {value, suggestions} = this.state;
		
		var inputProps = {
			placeholder: 'Search for a group',
			value,
			onChange: this.onChange
		};

		return(
			<Autosuggest
				suggestions={suggestions}
				onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
				onSuggestionsClearRequested={this.onSuggestionsClearRequested}
				getSuggestionValue={getSuggestionValue}
				renderSuggestion={renderSuggestion}
				inputProps={inputProps}
			/>
		);
	};
}

export default GroupSearch;