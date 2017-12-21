### 基本用法
<!-- start-code -->
```js
class SimplePicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: treeData,
      selectedValues: ['Master', 'Maya']
    };
  }

  handleOnChange = (values) => {
    this.setState({
      selectedValues: values
    });
  }

  render() {
    const { data, selectedValues } = this.state;
    return (
      <div className="example-item">
        <Picker
          defaultExpandAll
          height={320}
          data={data}
          onSelect={(activeNode, layer) => {
            console.log(activeNode, layer);
          }}
          onFilterNodes={(nodes, values)=>values}
        />
        <br />
        <Picker
          defaultExpandAll
          height={320}
          data={data}
          value={selectedValues}
          onSelect={(activeNode, layer) => {
            console.log(activeNode, layer);
          }}
          onChange={this.handleOnChange}
        />
      </div>
    );
  }
}

ReactDOM.render(<SimplePicker />)
```
<!-- end-code -->